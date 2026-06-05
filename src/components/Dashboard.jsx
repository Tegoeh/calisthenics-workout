import { useState } from 'react';
import { Play, Calendar, Flame, Scale, Trophy, Zap, CheckCircle2 } from 'lucide-react';

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
  waterIntake = 0,
  onUpdateWater
}) {
  const [selectedDayOverride, setSelectedDayOverride] = useState(null);
  
  // State untuk form input task update BB/TB
  const [taskWeight, setTaskWeight] = useState(weight);
  const [taskHeight, setTaskHeight] = useState(height);
  const [taskSuccess, setTaskSuccess] = useState(false);

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

      {/* Hydration Tracker */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-blue-950/40 rounded-xl border border-blue-800/30 text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
              </svg>
            </span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300">Pelacak Hidrasi Harian</h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950/30 border border-blue-900/30 px-2.5 py-0.5 rounded-full">
            {waterIntake} / 3000 ml
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          Konsumsi air minimal 3 liter (12 gelas) per hari untuk meminimalkan kram, memulihkan sendi/tendon, serta mendukung sintesis protein otot.
        </p>

        {/* Cup Grid */}
        <div className="grid grid-cols-6 gap-2 pt-2">
          {Array.from({ length: 12 }).map((_, index) => {
            const cupVolume = (index + 1) * 250;
            const isFilled = waterIntake >= cupVolume;
            return (
              <button
                key={index}
                onClick={() => {
                  const newAmount = isFilled ? cupVolume - 250 : cupVolume;
                  onUpdateWater(newAmount);
                }}
                className={`py-3.5 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer active:scale-95 ${
                  isFilled
                    ? 'bg-blue-950/30 border-blue-500/50 text-blue-400'
                    : 'bg-zinc-950/40 border-zinc-850 text-zinc-600 hover:border-zinc-800'
                }`}
                title={`${cupVolume} ml`}
              >
                <svg className="w-5 h-5" fill={isFilled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a7 7 0 007-7c0-4.3-7-13-7-13S5 9.7 5 14a7 7 0 007 7z"></path>
                </svg>
                <span className="text-[8px] font-mono mt-1 font-bold">250ml</span>
              </button>
            );
          })}
        </div>

        {/* Quick buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onUpdateWater(Math.max(0, waterIntake - 250))}
            className="flex-1 bg-zinc-950/40 border border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800 font-semibold py-2 px-3 rounded-xl transition text-[11px] flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>- 250ml</span>
          </button>
          <button
            onClick={() => onUpdateWater(Math.min(3000, waterIntake + 250))}
            className="flex-1 bg-blue-500 hover:bg-blue-400 text-zinc-950 font-bold py-2 px-3 rounded-xl transition text-[11px] flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>+ 250ml</span>
          </button>
          <button
            onClick={() => onUpdateWater(3000)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-2 px-3.5 rounded-xl transition text-[11px] flex items-center justify-center cursor-pointer"
            title="Penuhi target langsung"
          >
            <span>Penuh</span>
          </button>
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
    </div>
  );
}
