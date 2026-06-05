import React, { useState } from 'react';
import { Play, Dumbbell, Calendar, Info, CloudCheck, Flame, Scale, Trophy, AlertTriangle, ChevronRight, Zap } from 'lucide-react';

export default function Dashboard({ 
  jadwal, 
  progressHistory, 
  onStartWorkout, 
  connectionStatus,
  targetCalories,
  targetProtein
}) {
  const [selectedDayOverride, setSelectedDayOverride] = useState(null);

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
            <span className="text-xs font-bold text-zinc-200 mt-1 block">45kg / 15.2</span>
            <span className="text-[8px] text-red-400 font-semibold block mt-0.5">Sangat Kurus</span>
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
