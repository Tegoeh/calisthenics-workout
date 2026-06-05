import { useState } from 'react';
import { Play, Calendar, Flame, Scale, Trophy, Zap, CheckCircle2, Award, Activity, Edit3 } from 'lucide-react';

export default function Dashboard({ 
  jadwal, 
  progressHistory, 
  mealHistory = [],
  onStartWorkout, 
  connectionStatus,
  targetCalories,
  targetProtein,
  weight,
  setWeight,
  height,
  setHeight,
  lastPhysiqueUpdate,
  setLastPhysiqueUpdate,
  personalRecords = { pullup: 0, pushup: 0, dips: 0, lsit: 0, plank: 0, handstand: 0 },
  onUpdatePR,
  recoveryToday = null,
  onUpdateRecovery
}) {
  const [selectedDayOverride, setSelectedDayOverride] = useState(null);
  
  // State untuk form input task update BB/TB
  const [taskWeight, setTaskWeight] = useState(weight);
  const [taskHeight, setTaskHeight] = useState(height);
  const [taskSuccess, setTaskSuccess] = useState(false);

  // State baru untuk Recovery Tracker
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [sleepRating, setSleepRating] = useState(3);
  const [sorenessRating, setSorenessRating] = useState(3);
  const [energyRating, setEnergyRating] = useState(3);

  // State baru untuk PR Milestone
  const [showPRModal, setShowPRModal] = useState(false);
  const [editingPRKey, setEditingPRKey] = useState('pullup');
  const [editingPRValue, setEditingPRValue] = useState(0);

  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    const score = Math.round(((sleepRating + (6 - sorenessRating) + energyRating) / 15) * 100);
    let status = 'sedang';
    let rekomendasi = 'Kondisi Cukup. Disarankan latihan dengan volume sedang, fokus pada teknik gerakan, atau deload.';
    
    if (score >= 80) {
      status = 'prima';
      rekomendasi = 'Kondisi Prima! Tubuh Anda siap untuk latihan intens atau memecahkan rekor pribadi (PR).';
    } else if (score < 50) {
      status = 'istirahat';
      rekomendasi = 'Wajib Istirahat (Rest Day). Otot & tendon membutuhkan pemulihan penuh untuk menghindari cedera.';
    }
    
    onUpdateRecovery({
      score,
      sleep: sleepRating,
      soreness: sorenessRating,
      energy: energyRating,
      status,
      rekomendasi
    });
    setShowRecoveryModal(false);
  };

  const handlePRSubmit = (e) => {
    e.preventDefault();
    onUpdatePR(editingPRKey, Number(editingPRValue));
    setShowPRModal(false);
  };

  const getPRLabel = (key) => {
    switch (key) {
      case 'pullup': return 'Pull-up (Repetisi)';
      case 'pushup': return 'Push-up (Repetisi)';
      case 'dips': return 'Dips (Repetisi)';
      case 'lsit': return 'L-Sit (Detik)';
      case 'plank': return 'Plank (Detik)';
      case 'handstand': return 'Handstand (Detik)';
      default: return key;
    }
  };

  // Ambil nama hari bahasa Indonesia
  const getIndonesianDay = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  };

  const currentDay = selectedDayOverride || getIndonesianDay();
  
  // Filter latihan untuk hari aktif
  const workoutToday = jadwal.filter(item => item.Hari.toLowerCase() === currentDay.toLowerCase());
  const isRestDay = workoutToday.length === 0;

  // Hitung statistik latihan
  const getWeeklyProgress = () => {
    const completedThisWeek = progressHistory.filter(item => {
      const workoutDate = new Date(item.Tanggal);
      const today = new Date();
      // Hitung selisih hari
      const diffTime = Math.abs(today - workoutDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && item.Status === 'Selesai';
    });
    return completedThisWeek.length;
  };

  const completedCount = getWeeklyProgress();

  // Hitung total kalori dan protein hari ini
  const getTodayIntake = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMeals = mealHistory.filter(meal => {
      const mealDateStr = new Date(meal.timestamp).toISOString().split('T')[0];
      return mealDateStr === todayStr;
    });
    
    const calories = todayMeals.reduce((acc, meal) => acc + (meal.calories || 0), 0);
    const protein = todayMeals.reduce((acc, meal) => acc + (meal.protein || 0), 0);
    
    return { calories, protein };
  };

  const { calories: todayCalories, protein: todayProtein } = getTodayIntake();
  const calPercent = Math.min(Math.round((todayCalories / targetCalories) * 100), 100);
  const protPercent = Math.min(Math.round((todayProtein / targetProtein) * 100), 100);

  // Kalkulasi BMI Dinamis
  const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
  const getBmiCategory = (bmiValue) => {
    const val = parseFloat(bmiValue);
    if (val < 18.5) return { text: "Sangat Kurus", color: "text-red-400" };
    if (val < 25.0) return { text: "Normal", color: "text-lime-405" };
    return { text: "Kelebihan Berat", color: "text-orange-400" };
  };
  const bmiCat = getBmiCategory(bmi);

  // Cek apakah akhir bulan dan belum ada update BB/TB bulan ini
  const checkPhysiqueUpdateTask = () => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    // Aktif di 4 hari terakhir setiap bulan (misal tanggal 28-31)
    const isEndOfMonth = today.getDate() >= (lastDay - 3);
    
    let hasUpdatedThisMonth = false;
    if (lastPhysiqueUpdate) {
      const lastDate = new Date(lastPhysiqueUpdate);
      hasUpdatedThisMonth = lastDate.getFullYear() === today.getFullYear() && 
                           lastDate.getMonth() === today.getMonth();
    }
    
    return isEndOfMonth && !hasUpdatedThisMonth;
  };
  
  const showPhysiqueTask = checkPhysiqueUpdateTask();

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    setWeight(Number(taskWeight));
    setHeight(Number(taskHeight));
    const nowIso = new Date().toISOString();
    setLastPhysiqueUpdate(nowIso);
    setTaskSuccess(true);
    setTimeout(() => setTaskSuccess(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 px-4 py-2">
      {/* Profil Calisthenics & BMI Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-lime-500/10 rounded-full blur-2xl"></div>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-lime-950/40 rounded-xl border border-lime-800/30 text-lime-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Profil Target Ektomorf</span>
            <h2 className="text-md font-bold text-zinc-100">Adaptasi & Hipertrofi</h2>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3 text-center">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Fisik & BMI</span>
            <span className="text-xs font-bold text-zinc-200 mt-1 block font-mono">{weight}kg / {bmi}</span>
            <span className={`text-[8px] ${bmiCat.color} font-semibold block mt-0.5`}>{bmiCat.text}</span>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3 text-center">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Target Kalori</span>
            <span className="text-xs font-extrabold text-cyan-400 mt-1.5 block font-mono">{targetCalories} kkal</span>
            <span className="text-[8px] text-zinc-500 block mt-0.5">Surplus Harian</span>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3 text-center">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Target Protein</span>
            <span className="text-xs font-extrabold text-lime-400 mt-1.5 block font-mono">{targetProtein}g</span>
            <span className="text-[8px] text-zinc-500 block mt-0.5">Sintesis Otot</span>
          </div>
        </div>
      </div>

      {/* Recovery Score Tracker Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-rose-950/40 rounded-xl border border-rose-800/30 text-rose-400">
              <Activity className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300">Kesiapan Fisik & Pemulihan</h3>
          </div>
          {recoveryToday && (
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              recoveryToday.status === 'prima' 
                ? 'text-lime-400 bg-lime-950/30 border-lime-900/30' 
                : recoveryToday.status === 'sedang' 
                ? 'text-amber-400 bg-amber-950/30 border-amber-900/30'
                : 'text-red-400 bg-red-950/30 border-red-900/30'
            }`}>
              Skor: {recoveryToday.score}%
            </span>
          )}
        </div>

        {recoveryToday ? (
          <div className="space-y-3">
            <p className="text-xs text-zinc-300 leading-relaxed">
              {recoveryToday.rekomendasi}
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1.5 text-center text-[10px] font-semibold text-zinc-400">
              <div className="bg-zinc-950/40 border border-zinc-850 py-2 rounded-lg">
                <span className="text-zinc-500 block text-[8px] uppercase font-bold mb-0.5">Tidur</span>
                <span className="text-zinc-200 font-mono">{recoveryToday.sleep}/5</span>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-850 py-2 rounded-lg">
                <span className="text-zinc-500 block text-[8px] uppercase font-bold mb-0.5">Pegal</span>
                <span className="text-zinc-200 font-mono">{recoveryToday.soreness}/5</span>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-850 py-2 rounded-lg">
                <span className="text-zinc-500 block text-[8px] uppercase font-bold mb-0.5">Energi</span>
                <span className="text-zinc-200 font-mono">{recoveryToday.energy}/5</span>
              </div>
            </div>
            <button
              onClick={() => {
                setSleepRating(recoveryToday.sleep);
                setSorenessRating(recoveryToday.soreness);
                setEnergyRating(recoveryToday.energy);
                setShowRecoveryModal(true);
              }}
              className="w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300 font-bold transition cursor-pointer pt-1"
            >
              Perbarui Evaluasi
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Ketahui tingkat kesiapan otot, sistem saraf, dan tendon Anda hari ini untuk menentukan intensitas latihan yang optimal.
            </p>
            <button
              onClick={() => setShowRecoveryModal(true)}
              className="w-full bg-rose-600 hover:bg-rose-500 text-zinc-100 font-bold py-2.5 px-4 rounded-xl transition text-[11px] flex items-center justify-center space-x-1 cursor-pointer select-none active:scale-[0.98] shadow-md shadow-rose-900/10"
            >
              <span>Evaluasi Kesiapan Tubuh Hari Ini</span>
            </button>
          </div>
        )}
      </div>

      {/* Progress Nutrisi Hari Ini */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Flame className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300">Asupan Gizi Hari Ini</h3>
          </div>
          <span className="text-[8px] bg-zinc-950 border border-zinc-850 px-2.5 py-1 rounded-full text-zinc-500 font-extrabold uppercase tracking-wider">
            Target Surplus
          </span>
        </div>

        <div className="space-y-4">
          {/* Calorie Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Energi (Kalori)</span>
              <span className="font-mono text-zinc-300">
                <span className="text-cyan-400 font-bold">{todayCalories}</span> / {targetCalories} kkal
              </span>
            </div>
            <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-850/30">
              <div 
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-450 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${calPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[9px] text-zinc-500 font-bold">
              <span>{Math.round((todayCalories / targetCalories) * 100)}% Tercapai</span>
              {todayCalories < targetCalories ? (
                <span>Kurang {targetCalories - todayCalories} kkal lagi</span>
              ) : (
                <span className="text-cyan-400">Target Surplus Tercapai!</span>
              )}
            </div>
          </div>

          {/* Protein Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Pembangun Otot (Protein)</span>
              <span className="font-mono text-zinc-300">
                <span className="text-lime-400 font-bold">{todayProtein}</span> / {targetProtein}g
              </span>
            </div>
            <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-850/30">
              <div 
                className="h-full bg-gradient-to-r from-lime-600 to-lime-450 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${protPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[9px] text-zinc-500 font-bold">
              <span>{Math.round((todayProtein / targetProtein) * 100)}% Tercapai</span>
              {todayProtein < targetProtein ? (
                <span>Kurang {targetProtein - todayProtein}g lagi</span>
              ) : (
                <span className="text-lime-400">Sintesis Anabolik Aktif!</span>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Tugas Akhir Bulan: Update BB/TB */}
      {showPhysiqueTask && (
        <div className="bg-gradient-to-br from-amber-950/15 to-zinc-900 border border-amber-900/40 rounded-2xl p-6 shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-950/40 rounded-xl border border-amber-800/30 text-amber-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[8px] text-amber-400 font-bold uppercase tracking-wider block">Tugas Akhir Bulan</span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-250">Perbarui Berat & Tinggi Badan</h3>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Bulan ini segera berakhir! Update berat badan dan tinggi badan terbaru Anda untuk menyesuaikan program hipertrofi ektomorf Anda.
          </p>

          {taskSuccess ? (
            <div className="bg-lime-950/20 border border-lime-900 text-lime-400 p-3.5 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
              <span>Data fisik berhasil disimpan untuk bulan ini!</span>
            </div>
          ) : (
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Berat Badan (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500"
                    value={taskWeight}
                    onChange={(e) => setTaskWeight(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Tinggi Badan (cm)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500"
                    value={taskHeight}
                    onChange={(e) => setTaskHeight(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 px-4 rounded-xl transition text-xs cursor-pointer shadow-lg active:scale-[0.99]"
              >
                Simpan & Selesaikan Tugas Bulan Ini
              </button>
            </form>
          )}
        </div>
      )}

      {/* Main Focus: Hari Ini */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 text-zinc-300">
            <Calendar className="w-5 h-5 text-lime-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Jadwal Latihan</h3>
          </div>
          
          {/* Day Override Dropdown */}
          <select 
            value={currentDay} 
            onChange={(e) => setSelectedDayOverride(e.target.value)}
            className="bg-zinc-950 border border-zinc-850 rounded-lg text-xs font-semibold px-2 py-1 text-zinc-300 focus:outline-none focus:border-lime-500 transition cursor-pointer"
          >
            <option value="Senin">Senin (Pull & Core)</option>
            <option value="Selasa">Selasa (Rest)</option>
            <option value="Rabu">Rabu (Push & Legs)</option>
            <option value="Kamis">Kamis (Rest)</option>
            <option value="Jumat">Jumat (Full Body)</option>
            <option value="Sabtu">Sabtu (Rest)</option>
            <option value="Minggu">Minggu (Rest)</option>
          </select>
        </div>

        {/* REST DAY CARD */}
        {isRestDay ? (
          <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-400">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-200">Hari ini: Pemulihan Otot</h4>
              <p className="text-xs text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
                Tidak ada latihan hari ini. Pemulihan tendon dan otot sangat penting bagi hipertrofi. Fokus ke makan dan tidur!
              </p>
            </div>
            <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-900">
              Ingin tetap latihan? Silakan pilih hari latihan di menu dropdown kanan atas.
            </div>
          </div>
        ) : (
          /* WORKOUT SCHEDULE PRESENT */
          <div className="space-y-4">
            {/* Category / Routine Name */}
            <div className="flex items-center justify-between border-b border-zinc-850/80 pb-3">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Latihan Rutin</span>
                <h4 className="text-sm font-bold text-zinc-200">
                  {workoutToday[0].Kategori || 'Calisthenics'}
                </h4>
              </div>
              <span className="bg-lime-950/30 text-lime-400 border border-lime-800/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {workoutToday.length} Gerakan
              </span>
            </div>

            {/* List of Exercises for Today */}
            <div className="space-y-2">
              {workoutToday.map((ex, idx) => (
                <div 
                  key={idx} 
                  className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3 flex items-center justify-between hover:border-zinc-800 transition text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-semibold text-zinc-300">{ex.NamaGerakan}</span>
                    <span className="text-[10px] text-zinc-500 block">{ex.Reps} ({ex.Set} Set)</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/20 border border-cyan-900/30 px-2 py-0.5 rounded">
                    Rest {ex.Istirahat}s
                  </span>
                </div>
              ))}
            </div>

            {/* Start Button */}
            <button
              onClick={() => onStartWorkout(currentDay, workoutToday)}
              className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-950 font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm cursor-pointer shadow-lg shadow-lime-500/5 hover:shadow-lime-500/10 active:scale-[0.99] group"
            >
              <Play className="w-4 h-4 fill-current transition group-hover:scale-110" />
              <span>Mulai Sesi Latihan Sekarang</span>
            </button>
          </div>
        )}
      </div>

      {/* Weekly Motivation & Sync Status */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weekly Progress Counter */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl"></div>
          <Trophy className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Minggu Ini</span>
            <span className="text-md font-bold text-zinc-200 mt-1 block">
              {completedCount} Selesai
            </span>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-lime-500/5 rounded-full blur-xl"></div>
          <Flame className="w-5 h-5 text-lime-400" />
          <div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Status DB</span>
            <span className="text-xs font-bold mt-1.5 block">
              {connectionStatus === 'connected' ? (
                <span className="text-lime-400">Google Sheets</span>
              ) : (
                <span className="text-zinc-500">Simulasi Lokal</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Wall of Fame - Personal Records */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-amber-950/40 rounded-xl border border-amber-800/30 text-amber-400">
              <Award className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300">Wall of Fame - Rekor Pribadi</h3>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          Miliki catatan rekor gerakan calisthenics terbaik Anda untuk memacu motivasi *progressive overload*.
        </p>

        {/* PR Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {Object.keys(personalRecords).map((key) => {
            const val = personalRecords[key];
            const isDuration = ['lsit', 'plank', 'handstand'].includes(key);
            return (
              <div 
                key={key} 
                className="bg-zinc-950/50 border border-zinc-850 rounded-xl p-3 flex items-center justify-between hover:border-zinc-800 transition"
              >
                <div>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block">
                    {key === 'pullup' ? 'Pull-Up' : key === 'pushup' ? 'Push-Up' : key === 'dips' ? 'Dips' : key === 'lsit' ? 'L-Sit' : key === 'plank' ? 'Plank' : 'Handstand'}
                  </span>
                  <span className="text-xs font-extrabold text-zinc-200 mt-1 block font-mono">
                    {val} {isDuration ? 'detik' : 'reps'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setEditingPRKey(key);
                    setEditingPRValue(val);
                    setShowPRModal(true);
                  }}
                  className="p-1.5 hover:bg-zinc-900 rounded text-zinc-500 hover:text-amber-400 transition cursor-pointer"
                  title="Update Rekor"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recovery Evaluation Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-zinc-850">
              <Activity className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-sm text-zinc-100">Kesiapan Latihan Hari Ini</h3>
            </div>
            
            <form onSubmit={handleRecoverySubmit} className="space-y-4 text-xs">
              {/* Sleep Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-zinc-400 font-semibold">
                  <span>Kualitas Tidur (Semalam)</span>
                  <span className="text-zinc-200 font-mono">{sleepRating}/5</span>
                </div>
                <input 
                  type="range" min="1" max="5" 
                  value={sleepRating} 
                  onChange={(e) => setSleepRating(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-zinc-950 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>Sangat Buruk</span>
                  <span>Sangat Nyenyak</span>
                </div>
              </div>

              {/* Soreness Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-zinc-400 font-semibold">
                  <span>Tingkat Pegal/Sakit Otot</span>
                  <span className="text-zinc-200 font-mono">{sorenessRating}/5</span>
                </div>
                <input 
                  type="range" min="1" max="5" 
                  value={sorenessRating} 
                  onChange={(e) => setSorenessRating(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-zinc-950 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>Tidak Pegal</span>
                  <span>Sangat Pegal</span>
                </div>
              </div>

              {/* Energy Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-zinc-400 font-semibold">
                  <span>Energi & Kelelahan Tubuh</span>
                  <span className="text-zinc-200 font-mono">{energyRating}/5</span>
                </div>
                <input 
                  type="range" min="1" max="5" 
                  value={energyRating} 
                  onChange={(e) => setEnergyRating(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-zinc-950 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>Sangat Lelah</span>
                  <span>Sangat Berenergi</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 font-bold py-2.5 rounded-xl transition cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-zinc-100 font-bold py-2.5 rounded-xl transition cursor-pointer text-center"
                >
                  Simpan Skor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PR Update Modal */}
      {showPRModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-zinc-850">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-zinc-100">Perbarui Rekor Baru</h3>
            </div>
            
            <form onSubmit={handlePRSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold block">
                  {getPRLabel(editingPRKey)}
                </label>
                <input 
                  type="number" 
                  min="0"
                  value={editingPRValue} 
                  onChange={(e) => setEditingPRValue(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-amber-500 focus:outline-none p-3 rounded-xl text-zinc-100 font-bold font-mono text-center text-md"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPRModal(false)}
                  className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 font-bold py-2.5 rounded-xl transition cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold py-2.5 rounded-xl transition cursor-pointer text-center"
                >
                  Simpan Rekor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
