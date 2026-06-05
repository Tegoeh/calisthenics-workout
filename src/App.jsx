import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, BookOpen, Settings as SettingsIcon, Shield, RefreshCw, Sparkles } from 'lucide-react';
import Dashboard from './components/Dashboard';
import WorkoutSession from './components/WorkoutSession';
import History from './components/History';
import CalisthenicsGuide from './components/CalisthenicsGuide';
import Settings from './components/Settings';
import MealTracker from './components/MealTracker';
import { DEFAULT_JADWAL } from './utils/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [webAppUrl, setWebAppUrl] = useState('');
  const [jadwal, setJadwal] = useState(DEFAULT_JADWAL);
  const [progressHistory, setProgressHistory] = useState([]);
  const [mealHistory, setMealHistory] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('offline'); // 'connected' | 'offline'
  const [targetCalories, setTargetCalories] = useState(2800);
  const [targetProtein, setTargetProtein] = useState(80);
  
  // State untuk sesi aktif
  const [activeWorkout, setActiveWorkout] = useState(null); // { day, workoutList }
  const [loading, setLoading] = useState(false);

  const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbxstiZ_TZF4h03jXIG5oUvcrPC4Q1KmhJuOnPDr9iZJ0OG87A0I4zFvrpJ2Xp0OCYej/exec';

  // Load awal dari LocalStorage
  useEffect(() => {
    let savedUrl = localStorage.getItem('calisthenics_web_app_url');
    // Daftar URL lama yang bermasalah atau tidak sinkron
    const legacyUrls = [
      'https://script.google.com/macros/s/AKfycbwJkWVtCrxYeOUmW4XMmyv3Y4IH1J10eO8-8IXfS4FUuzkWRwDJ8MCSqkT8WTbaFidb/exec',
      'https://script.google.com/macros/s/AKfycbz4iq4lG5VAIM5XueMSsVKj0Tw8mLNHVRI1Ij80qPsrf39797wmG468F6TiYDS-ucHN/exec'
    ];
    
    // Migrasi otomatis ke link yang baru jika menggunakan link lama atau masih kosong
    if (!savedUrl || legacyUrls.some(u => savedUrl.trim() === u)) {
      savedUrl = DEFAULT_URL;
      localStorage.setItem('calisthenics_web_app_url', DEFAULT_URL);
    } else {
      savedUrl = savedUrl.trim();
    }
    setWebAppUrl(savedUrl);

    const savedProgress = localStorage.getItem('calisthenics_progress_history');
    if (savedProgress) {
      setProgressHistory(JSON.parse(savedProgress));
    }

    const savedMeals = localStorage.getItem('calisthenics_meal_history');
    if (savedMeals) {
      setMealHistory(JSON.parse(savedMeals));
    }

    const savedCal = localStorage.getItem('calisthenics_target_calories') || '2800';
    const savedProt = localStorage.getItem('calisthenics_target_protein') || '80';
    setTargetCalories(Number(savedCal));
    setTargetProtein(Number(savedProt));

    loadDataFromSheets(savedUrl);
  }, []);

  // Mencatat Makanan (Gizi AI)
  const handleLogMeal = async (mealData) => {
    const newMeal = {
      id: Date.now().toString(),
      foodName: mealData.foodName,
      calories: Number(mealData.calories || 0),
      protein: Number(mealData.protein || 0),
      carbs: Number(mealData.carbs || 0),
      fat: Number(mealData.fat || 0),
      timestamp: new Date().toISOString()
    };
    const updatedMeals = [newMeal, ...mealHistory];
    setMealHistory(updatedMeals);
    localStorage.setItem('calisthenics_meal_history', JSON.stringify(updatedMeals));

    if (connectionStatus === 'connected' && webAppUrl) {
      try {
        await fetch(webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({
            action: 'log_meal',
            id: newMeal.id,
            foodName: newMeal.foodName,
            calories: newMeal.calories,
            protein: newMeal.protein,
            carbs: newMeal.carbs,
            fat: newMeal.fat,
            timestamp: newMeal.timestamp,
            tanggal: newMeal.timestamp.split('T')[0]
          })
        });
        
        // Muat ulang dari sheet agar tersinkron sempurna
        setTimeout(() => {
          loadDataFromSheets(webAppUrl);
        }, 1500);
      } catch (error) {
        console.error("Gagal mengirim makanan ke database:", error);
      }
    }
  };

  // Menghapus Catatan Makanan
  const handleDeleteMeal = async (id) => {
    const updatedMeals = mealHistory.filter(meal => meal.id !== id);
    setMealHistory(updatedMeals);
    localStorage.setItem('calisthenics_meal_history', JSON.stringify(updatedMeals));

    if (connectionStatus === 'connected' && webAppUrl) {
      try {
        await fetch(webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({
            action: 'delete_meal',
            id: id
          })
        });

        // Muat ulang dari sheet agar tersinkron sempurna
        setTimeout(() => {
          loadDataFromSheets(webAppUrl);
        }, 1500);
      } catch (error) {
        console.error("Gagal menghapus makanan dari database:", error);
      }
    }
  };

  // Memuat data dari Google Sheets (GET)
  const loadDataFromSheets = async (url) => {
    if (!url) return;
    const cleanUrl = url.trim();
    setLoading(true);
    try {
      const response = await fetch(cleanUrl);
      if (!response.ok) throw new Error("Gagal mengambil data dari Google Sheets");
      
      const data = await response.json();
      if (data.status === 'success') {
        if (data.jadwal && data.jadwal.length > 0) {
          setJadwal(data.jadwal);
        }
        if (data.progress) {
          setProgressHistory(data.progress);
          localStorage.setItem('calisthenics_progress_history', JSON.stringify(data.progress));
        }
        if (data.makanan) {
          const mappedMeals = data.makanan.map(meal => ({
            id: meal.Id || meal.id,
            foodName: meal.NamaMakanan || meal.foodName,
            calories: Number(meal.Kalori || meal.calories || 0),
            protein: Number(meal.Protein || meal.protein || 0),
            carbs: Number(meal.Karbohidrat || meal.carbs || 0),
            fat: Number(meal.Lemak || meal.fat || 0),
            timestamp: meal.Timestamp || meal.timestamp
          }));
          setMealHistory(mappedMeals);
          localStorage.setItem('calisthenics_meal_history', JSON.stringify(mappedMeals));
        }
        setConnectionStatus('connected');
      } else {
        console.warn("Apps Script mengembalikan status gagal:", data.message);
        setConnectionStatus('offline');
      }
    } catch (error) {
      console.error("Error loading data from Sheets:", error);
      setConnectionStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  // Tes Koneksi (dari menu Settings)
  const handleTestConnection = async (url) => {
    if (!url) return false;
    const cleanUrl = url.trim();
    setLoading(true);
    try {
      const response = await fetch(cleanUrl);
      if (!response.ok) throw new Error("Gagal menghubungi endpoint");
      
      const data = await response.json();
      if (data.status === 'success') {
        if (data.jadwal && data.jadwal.length > 0) {
          setJadwal(data.jadwal);
        }
        if (data.progress) {
          setProgressHistory(data.progress);
          localStorage.setItem('calisthenics_progress_history', JSON.stringify(data.progress));
        }
        if (data.makanan) {
          const mappedMeals = data.makanan.map(meal => ({
            id: meal.Id || meal.id,
            foodName: meal.NamaMakanan || meal.foodName,
            calories: Number(meal.Kalori || meal.calories || 0),
            protein: Number(meal.Protein || meal.protein || 0),
            carbs: Number(meal.Karbohidrat || meal.carbs || 0),
            fat: Number(meal.Lemak || meal.fat || 0),
            timestamp: meal.Timestamp || meal.timestamp
          }));
          setMealHistory(mappedMeals);
          localStorage.setItem('calisthenics_meal_history', JSON.stringify(mappedMeals));
        }
        setConnectionStatus('connected');
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error testing connection:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Memulai Sesi Workout
  const handleStartWorkout = (day, workoutList) => {
    setActiveWorkout({ day, workoutList });
  };

  // Menyelesaikan Sesi Workout (POST)
  const handleFinishWorkout = async (day, notes) => {
    const newRecord = {
      Tanggal: new Date().toISOString(),
      HariWorkout: day,
      Status: "Selesai",
      Catatan: notes
    };

    setLoading(true);

    // Update state lokal terlebih dahulu (optimistic update)
    const updatedHistory = [newRecord, ...progressHistory];
    setProgressHistory(updatedHistory);
    localStorage.setItem('calisthenics_progress_history', JSON.stringify(updatedHistory));

    if (connectionStatus === 'connected' && webAppUrl) {
      try {
        // Trik menggunakan text/plain content-type untuk menghindari preflight OPTIONS CORS di Apps Script
        await fetch(webAppUrl, {
          method: 'POST',
          mode: 'no-cors', // Mencegah pemblokiran CORS pada redirect Apps Script
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({
            tanggal: newRecord.Tanggal.split('T')[0],
            hariWorkout: newRecord.HariWorkout,
            status: newRecord.Status,
            catatan: newRecord.Catatan
          })
        });
        
        // Muat ulang data terbaru setelah POST agar tersinkronisasi sempurna
        // Karena no-cors tidak mengizinkan membaca body, kita panggil GET ulang secara background
        setTimeout(() => {
          loadDataFromSheets(webAppUrl);
        }, 1500);

      } catch (error) {
        console.error("Gagal mengirim data ke Google Sheets:", error);
      }
    }

    setLoading(false);
    setActiveWorkout(null);
    setActiveTab('history');
  };

  const handleCancelWorkout = () => {
    if (window.confirm("Apakah Anda yakin ingin membatalkan sesi latihan ini? Progress saat ini tidak akan disimpan.")) {
      setActiveWorkout(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-lime-500 selection:text-zinc-950">
      
      {/* Header Aplikasi (Tersembunyi jika sedang dalam mode workout aktif untuk memaksimalkan fokus) */}
      {!activeWorkout && (
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-4 py-4">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Dumbbell className="w-6 h-6 text-lime-400 animate-pulse" />
              <div>
                <h1 className="text-md font-extrabold tracking-tight text-zinc-100 leading-none">
                  GRAVITAS<span className="text-lime-400">FIT</span>
                </h1>
                <span className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase">
                  Calisthenics Jadwal
                </span>
              </div>
            </div>

            {/* Sync Badge */}
            <div className="flex items-center space-x-1">
              {loading && <RefreshCw className="w-3.5 h-3.5 text-lime-400 animate-spin mr-1" />}
              {connectionStatus === 'connected' ? (
                <span className="bg-lime-950/30 text-lime-400 border border-lime-800/40 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span>
                  <span>Cloud DB</span>
                </span>
              ) : (
                <span className="bg-zinc-900 text-zinc-500 border border-zinc-800 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                  <span>Lokal</span>
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-24 pt-4 overflow-y-auto">
        {activeWorkout ? (
          <WorkoutSession
            day={activeWorkout.day}
            workoutList={activeWorkout.workoutList}
            onFinishWorkout={handleFinishWorkout}
            onCancelWorkout={handleCancelWorkout}
            loading={loading}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                jadwal={jadwal}
                progressHistory={progressHistory}
                mealHistory={mealHistory}
                onStartWorkout={handleStartWorkout}
                connectionStatus={connectionStatus}
                targetCalories={targetCalories}
                targetProtein={targetProtein}
              />
            )}
            {activeTab === 'history' && (
              <History
                progressHistory={progressHistory}
                connectionStatus={connectionStatus}
              />
            )}
            {activeTab === 'guide' && (
              <CalisthenicsGuide />
            )}
            {activeTab === 'meal' && (
              <MealTracker
                webAppUrl={webAppUrl}
                connectionStatus={connectionStatus}
                mealHistory={mealHistory}
                onLogMeal={handleLogMeal}
                onDeleteMeal={handleDeleteMeal}
              />
            )}
            {activeTab === 'settings' && (
              <Settings
                webAppUrl={webAppUrl}
                setWebAppUrl={setWebAppUrl}
                defaultUrl={DEFAULT_URL}
                onTestConnection={handleTestConnection}
                connectionStatus={connectionStatus}
                loading={loading}
                targetCalories={targetCalories}
                setTargetCalories={setTargetCalories}
                targetProtein={targetProtein}
                setTargetProtein={setTargetProtein}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation (Tersembunyi jika sedang dalam mode workout aktif) */}
      {!activeWorkout && (
        <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-900 py-2.5 px-6 z-45">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            
            {/* Dashboard Tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center space-y-1 transition cursor-pointer ${
                activeTab === 'dashboard' ? 'text-lime-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Dumbbell className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-wide">Latihan</span>
            </button>

            {/* History Tab */}
            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center space-y-1 transition cursor-pointer ${
                activeTab === 'history' ? 'text-lime-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-wide">Riwayat</span>
            </button>

            {/* Guide Tab */}
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex flex-col items-center space-y-1 transition cursor-pointer ${
                activeTab === 'guide' ? 'text-lime-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-wide">Panduan</span>
            </button>

            {/* Meal Tracker Tab */}
            <button
              onClick={() => setActiveTab('meal')}
              className={`flex flex-col items-center space-y-1 transition cursor-pointer ${
                activeTab === 'meal' ? 'text-lime-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-wide">Gizi AI</span>
            </button>

            {/* Settings Tab */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center space-y-1 transition cursor-pointer ${
                activeTab === 'settings' ? 'text-lime-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-wide">Database</span>
            </button>

          </div>
        </nav>
      )}

    </div>
  );
}
