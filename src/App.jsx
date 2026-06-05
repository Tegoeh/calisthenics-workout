import { useState, useEffect } from 'react';
import { Dumbbell, Calendar, BookOpen, Settings as SettingsIcon, RefreshCw, Sparkles } from 'lucide-react';
import Dashboard from './components/Dashboard';
import WorkoutSession from './components/WorkoutSession';
import History from './components/History';
import CalisthenicsGuide from './components/CalisthenicsGuide';
import Settings from './components/Settings';
import MealTracker from './components/MealTracker';
import { DEFAULT_JADWAL } from './utils/mockData';
import { PROGRESSION_DATABASE, generateDefaultLangkah } from './utils/progressionDb';

export default function App() {
  const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbxstiZ_TZF4h03jXIG5oUvcrPC4Q1KmhJuOnPDr9iZJ0OG87A0I4zFvrpJ2Xp0OCYej/exec';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [webAppUrl, setWebAppUrl] = useState(() => {
    const saved = localStorage.getItem('calisthenics_web_app_url');
    const legacyUrls = [
      'https://script.google.com/macros/s/AKfycbwJkWVtCrxYeOUmW4XMmyv3Y4IH1J10eO8-8IXfS4FUuzkWRwDJ8MCSqkT8WTbaFidb/exec',
      'https://script.google.com/macros/s/AKfycbz4iq4lG5VAIM5XueMSsVKj0Tw8mLNHVRI1Ij80qPsrf39797wmG468F6TiYDS-ucHN/exec'
    ];
    if (!saved || legacyUrls.some(u => saved.trim() === u)) {
      localStorage.setItem('calisthenics_web_app_url', DEFAULT_URL);
      return DEFAULT_URL;
    }
    return saved.trim();
  });

  const [jadwal, setJadwal] = useState(() => {
    const saved = localStorage.getItem('calisthenics_jadwal');
    return saved ? JSON.parse(saved) : DEFAULT_JADWAL;
  });

  // Sinkronisasi jadwal ke LocalStorage jika berubah
  useEffect(() => {
    localStorage.setItem('calisthenics_jadwal', JSON.stringify(jadwal));
  }, [jadwal]);
  const [progressHistory, setProgressHistory] = useState(() => {
    const saved = localStorage.getItem('calisthenics_progress_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [mealHistory, setMealHistory] = useState(() => {
    const saved = localStorage.getItem('calisthenics_meal_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [connectionStatus, setConnectionStatus] = useState('offline'); // 'connected' | 'offline'
  const [targetCalories, setTargetCalories] = useState(() => {
    return Number(localStorage.getItem('calisthenics_target_calories') || '2800');
  });
  const [targetProtein, setTargetProtein] = useState(() => {
    return Number(localStorage.getItem('calisthenics_target_protein') || '80');
  });
  
  // State untuk fisik (BB & TB)
  const [weight, setWeight] = useState(() => {
    return Number(localStorage.getItem('calisthenics_weight') || '45');
  });
  const [height, setHeight] = useState(() => {
    return Number(localStorage.getItem('calisthenics_height') || '172');
  });
  const [weightHistory, setWeightHistory] = useState(() => {
    const savedWeightHistory = localStorage.getItem('calisthenics_weight_history');
    if (savedWeightHistory) {
      return JSON.parse(savedWeightHistory);
    } else {
      const savedWeight = localStorage.getItem('calisthenics_weight') || '45';
      const initialHistory = [
        { weight: 44.0, date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { weight: 44.5, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { weight: Number(savedWeight), date: new Date().toISOString().split('T')[0] }
      ];
      localStorage.setItem('calisthenics_weight_history', JSON.stringify(initialHistory));
      return initialHistory;
    }
  });
  const [lastPhysiqueUpdate, setLastPhysiqueUpdate] = useState(() => {
    return localStorage.getItem('calisthenics_last_physique_update') || '';
  });

  const [personalRecords, setPersonalRecords] = useState(() => {
    const saved = localStorage.getItem('calisthenics_personal_records');
    return saved ? JSON.parse(saved) : {
      pullup: 0,
      pushup: 0,
      dips: 0,
      lsit: 0,
      plank: 0,
      handstand: 0
    };
  });

  const [recoveryToday, setRecoveryToday] = useState(() => {
    const saved = localStorage.getItem('calisthenics_recovery_today');
    const today = new Date().toISOString().split('T')[0];
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) {
        return parsed.data;
      }
    }
    return null;
  });

  // State RPG
  const [rpgLevel, setRpgLevel] = useState(() => {
    return Number(localStorage.getItem('calisthenics_rpg_level') || '1');
  });
  const [rpgXp, setRpgXp] = useState(() => {
    return Number(localStorage.getItem('calisthenics_rpg_xp') || '0');
  });
  const [rpgCoins, setRpgCoins] = useState(() => {
    return Number(localStorage.getItem('calisthenics_rpg_coins') || '0');
  });
  const [rpgBossesDefeated, setRpgBossesDefeated] = useState(() => {
    return Number(localStorage.getItem('calisthenics_rpg_bosses_defeated') || '0');
  });
  const [rpgBadges, setRpgBadges] = useState(() => {
    const saved = localStorage.getItem('calisthenics_rpg_badges');
    return saved ? JSON.parse(saved) : [];
  });

  const handleUpdatePR = (key, value) => {
    const updated = { ...personalRecords, [key]: Number(value) };
    setPersonalRecords(updated);
    localStorage.setItem('calisthenics_personal_records', JSON.stringify(updated));
  };

  const handleRewardRPG = (xpGained, coinsGained, newBadge = null) => {
    let nextXp = rpgXp + xpGained;
    let nextLevel = rpgLevel;
    let xpNeeded = nextLevel * 150;
    
    while (nextXp >= xpNeeded) {
      nextXp -= xpNeeded;
      nextLevel += 1;
      xpNeeded = nextLevel * 150;
    }

    setRpgLevel(nextLevel);
    setRpgXp(nextXp);
    
    setRpgCoins(prev => {
      const updated = prev + coinsGained;
      localStorage.setItem('calisthenics_rpg_coins', updated.toString());
      return updated;
    });
    
    localStorage.setItem('calisthenics_rpg_level', nextLevel.toString());
    localStorage.setItem('calisthenics_rpg_xp', nextXp.toString());

    if (newBadge) {
      setRpgBadges(prev => {
        if (!prev.includes(newBadge)) {
          const updated = [...prev, newBadge];
          localStorage.setItem('calisthenics_rpg_badges', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
    
    setRpgBossesDefeated(prev => {
      const updated = prev + 1;
      localStorage.setItem('calisthenics_rpg_bosses_defeated', updated.toString());
      return updated;
    });
  };



  const handleReplaceJadwalExercise = (oldName, newName) => {
    // Cari gerakan baru di PROGRESSION_DATABASE
    let foundLevel = null;
    
    for (const key of Object.keys(PROGRESSION_DATABASE)) {
      const level = PROGRESSION_DATABASE[key].levels.find(l => l.name === newName);
      if (level) {
        foundLevel = level;
        break;
      }
    }
    
    if (!foundLevel) return false;
    
    // Tentukan target reps/durasi baru berdasarkan threshold di db
    let newReps = "";
    const isDuration = ['plank', 'lsit', 'handstand', 'hang'].some(keyword => newName.toLowerCase().includes(keyword));
    if (isDuration) {
      newReps = `${Math.round(foundLevel.threshold * 0.6)}-${foundLevel.threshold} detik`;
    } else {
      newReps = `${Math.round(foundLevel.threshold * 0.8)}-${foundLevel.threshold} reps`;
    }
    
    const newDesc = foundLevel.desc;
    const newLangkah = generateDefaultLangkah(newName, newDesc);
    
    // Update jadwal dengan mencocokkan nama gerakan lama secara substring/parsial
    const updatedJadwal = jadwal.map(ex => {
      const exLower = ex.NamaGerakan.toLowerCase();
      const oldLower = oldName.toLowerCase();
      
      if (exLower.includes(oldLower) || oldLower.includes(exLower)) {
        return {
          ...ex,
          NamaGerakan: newName,
          Reps: newReps,
          Deskripsi: newDesc,
          Langkah: newLangkah
        };
      }
      return ex;
    });
    
    setJadwal(updatedJadwal);
    localStorage.setItem('calisthenics_jadwal', JSON.stringify(updatedJadwal));
    return true;
  };

  const handleUpdateRecovery = (data) => {
    const today = new Date().toISOString().split('T')[0];
    setRecoveryToday(data);
    localStorage.setItem('calisthenics_recovery_today', JSON.stringify({ date: today, data }));
  };

  // State untuk sesi aktif
  const [activeWorkout, setActiveWorkout] = useState(null); // { day, workoutList }
  const [loading, setLoading] = useState(false);

  // Load awal dari Google Sheets
  useEffect(() => {
    loadDataFromSheets(webAppUrl);
  }, [webAppUrl]);

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
  async function loadDataFromSheets(url) {
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

  // Perbarui Berat Badan & Riwayat BB
  const handleUpdateWeight = (newWeight) => {
    const w = Number(newWeight);
    setWeight(w);
    localStorage.setItem('calisthenics_weight', w.toString());

    // Perbarui riwayat berat badan
    const todayStr = new Date().toISOString().split('T')[0];
    setWeightHistory(prev => {
      const existingIdx = prev.findIndex(item => item.date === todayStr);
      let updated;
      if (existingIdx > -1) {
        updated = prev.map((item, idx) => idx === existingIdx ? { ...item, weight: w } : item);
      } else {
        updated = [...prev, { weight: w, date: todayStr }];
      }
      updated.sort((a, b) => new Date(a.date) - new Date(b.date));
      localStorage.setItem('calisthenics_weight_history', JSON.stringify(updated));
      return updated;
    });
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
            personalRecords={personalRecords}
            onUpdatePR={handleUpdatePR}
            weight={weight}
            weightHistory={weightHistory}
            progressHistory={progressHistory}
            onReplaceJadwalExercise={handleReplaceJadwalExercise}
            onRewardRPG={handleRewardRPG}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                jadwal={jadwal}
                progressHistory={progressHistory}
                mealHistory={mealHistory}
                onStartWorkout={handleStartWorkout}
                onReplaceJadwalExercise={handleReplaceJadwalExercise}
                connectionStatus={connectionStatus}
                targetCalories={targetCalories}
                targetProtein={targetProtein}
                weight={weight}
                setWeight={handleUpdateWeight}
                height={height}
                setHeight={(h) => {
                  setHeight(h);
                  localStorage.setItem('calisthenics_height', h);
                }}
                lastPhysiqueUpdate={lastPhysiqueUpdate}
                setLastPhysiqueUpdate={(date) => {
                  setLastPhysiqueUpdate(date);
                  localStorage.setItem('calisthenics_last_physique_update', date);
                }}
                personalRecords={personalRecords}
                onUpdatePR={handleUpdatePR}
                recoveryToday={recoveryToday}
                onUpdateRecovery={handleUpdateRecovery}
                rpgLevel={rpgLevel}
                rpgXp={rpgXp}
                rpgCoins={rpgCoins}
                rpgBossesDefeated={rpgBossesDefeated}
                rpgBadges={rpgBadges}
              />
            )}
            {activeTab === 'history' && (
              <History
                progressHistory={progressHistory}
                weightHistory={weightHistory}
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
                targetCalories={targetCalories}
                targetProtein={targetProtein}
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
                weight={weight}
                setWeight={handleUpdateWeight}
                height={height}
                setHeight={(h) => {
                  setHeight(h);
                  localStorage.setItem('calisthenics_height', h);
                }}
                progressHistory={progressHistory}
                mealHistory={mealHistory}
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
