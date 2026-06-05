import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, Play, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, Volume2, VolumeX, ArrowLeft, FastForward } from 'lucide-react';

export default function WorkoutSession({ 
  day, 
  workoutList, 
  onFinishWorkout, 
  onCancelWorkout, 
  loading 
}) {
  const [sessionPhase, setSessionPhase] = useState('warmup'); // 'warmup' | 'workout' | 'cooldown' | 'finish'
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  
  const timerRef = useRef(null);
  
  const activeExercise = workoutList[currentExerciseIdx];
  const totalExercises = workoutList.length;

  const warmupItems = [
    {
      name: "Rotasi Sendi Bahu & Lengan",
      duration: "10-15 putaran",
      desc: "Putar bahu ke depan dan belakang secara perlahan untuk melumasi sendi peluru bahu."
    },
    {
      name: "Peregangan Pergelangan Tangan (Wrist Stretch)",
      duration: "30-45 detik",
      desc: "Lakukan peregangan pergelangan tangan di lantai dalam berbagai arah genggaman. Sangat penting bagi pemula calisthenics untuk menghindari cedera."
    },
    {
      name: "Scapula Shrugs (Active Hang)",
      duration: "10 repetisi",
      desc: "Tarik bahu ke atas dan ke bawah saat menggantung di bar untuk mengaktifkan belikat dan otot trapezius."
    },
    {
      name: "Bodyweight Squat Ringan",
      duration: "8-10 repetisi",
      desc: "Squat perlahan tanpa beban tambahan untuk memanaskan sendi lutut dan pinggul."
    },
    {
      name: "Jumping Jacks / Lari di Tempat",
      duration: "1 menit",
      desc: "Meningkatkan detak jantung secara bertahap dan menaikkan suhu tubuh inti sebelum menarik/mendorong beban tubuh."
    }
  ];

  const cooldownItems = [
    {
      name: "Peregangan Bahu (Shoulder Stretch)",
      duration: "30 detik/sisi",
      desc: "Tarik lengan menyilang dada dan tahan dengan tangan yang lain untuk meregangkan deltoid."
    },
    {
      name: "Peregangan Dada (Chest Stretch)",
      duration: "30 detik/sisi",
      desc: "Letakkan satu tangan pada dinding atau tiang bar, lalu putar tubuh berlawanan arah untuk meregangkan dada."
    },
    {
      name: "Child's Pose (Dekompresi Tulang Belakang)",
      duration: "1 menit",
      desc: "Duduk bertumpu pada tumit kaki, luruskan lengan ke depan lantai, dan letakkan dahi di lantai untuk menenangkan saraf dan mendekopresi tulang belakang."
    },
    {
      name: "Peregangan Pergelangan Tangan Pasif",
      duration: "30 detik",
      desc: "Tarik telapak tangan ke arah dalam untuk menenangkan tendon pergelangan tangan yang tegang pasca-gantungan."
    },
    {
      name: "Pernapasan Dalam (Deep Breathing)",
      duration: "1-2 menit",
      desc: "Tarik napas dalam dari hidung, keluarkan perlahan dari mulut untuk mengembalikan detak jantung ke kondisi istirahat (parasimpatis)."
    }
  ];

  useEffect(() => {
    setShowDetails(false);
  }, [currentExerciseIdx]);

  // Bunyikan beep menggunakan Web Audio API
  const playBeep = (frequency, duration) => {
    if (!isSoundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("AudioContext failed to start: ", e);
    }
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (isResting && restTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsResting(false);
            // Bunyi beep panjang menandakan istirahat selesai
            playBeep(880, 0.5);
            goToNextStep();
            return 0;
          }
          // Bunyi beep pendek di 3 detik terakhir
          if (prev <= 4) {
            playBeep(440, 0.1);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [isResting, restTimeLeft]);

  const handleFinishSet = () => {
    // Bunyikan beep saat set selesai
    playBeep(660, 0.15);
    
    // Tentukan waktu istirahat (default ke 60 jika tidak disetel)
    const restDuration = parseInt(activeExercise.Istirahat) || 60;
    setRestTimeLeft(restDuration);
    setIsResting(true);
  };

  const skipRest = () => {
    clearInterval(timerRef.current);
    setIsResting(false);
    goToNextStep();
  };

  const goToNextStep = () => {
    if (currentSet < activeExercise.Set) {
      // Lanjut ke set berikutnya di gerakan yang sama
      setCurrentSet(prev => prev + 1);
    } else {
      // Jika set sudah habis, pindah ke gerakan berikutnya
      if (currentExerciseIdx < totalExercises - 1) {
        setCurrentExerciseIdx(prev => prev + 1);
        setCurrentSet(1);
      } else {
        // Semua gerakan selesai, lanjut ke pendinginan
        setSessionPhase('cooldown');
        playBeep(523.25, 0.8); // Beep C5 untuk sukses besar
      }
    }
  };

  const handleSaveWorkout = () => {
    onFinishWorkout(day, notes);
  };

  // 1. Tampilan Layar Pemanasan (Warm-Up)
  if (sessionPhase === 'warmup') {
    return (
      <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onCancelWorkout}
            className="flex items-center space-x-1.5 text-zinc-500 hover:text-zinc-350 text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Batalkan Sesi</span>
          </button>
          <span className="text-[10px] bg-amber-950/30 text-amber-400 border border-amber-850/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Fase 1: Pemanasan
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-zinc-150">Pemanasan Wajib (Warm-Up)</h2>
            <p className="text-xs text-zinc-455 leading-relaxed font-sans">
              Pemanasan sangat krusial untuk melumasi sendi belikat & pergelangan tangan, meregangkan otot secara aktif, dan mencegah ketegangan tendon berlebih.
            </p>
          </div>

          <div className="space-y-3.5">
            {warmupItems.map((item, idx) => (
              <div key={idx} className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-3.5 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono text-[9px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{item.name}</span>
                  </h4>
                  <span className="text-[9px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-amber-400 font-mono font-bold shrink-0">
                    {item.duration}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 pl-6 leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              playBeep(660, 0.2);
              setSessionPhase('workout');
            }}
            className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-950 font-extrabold py-4 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm cursor-pointer shadow-lg active:scale-[0.98]"
          >
            <span>Mulai Latihan Inti (Workout)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Tampilan Layar Pendinginan (Cool-Down)
  if (sessionPhase === 'cooldown') {
    return (
      <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
        <div className="flex justify-end">
          <span className="text-[10px] bg-cyan-950/30 text-cyan-400 border border-cyan-850/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Fase 3: Pendinginan
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-zinc-150">Pendinginan & Recovery (Cool-Down)</h2>
            <p className="text-xs text-zinc-455 leading-relaxed font-sans">
              Regangkan otot-otot Anda untuk merangsang proses perbaikan serat otot, meredakan stres saraf pusat, dan mengembalikan detak jantung ke kondisi istirahat.
            </p>
          </div>

          <div className="space-y-3.5">
            {cooldownItems.map((item, idx) => (
              <div key={idx} className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-3.5 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono text-[9px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{item.name}</span>
                  </h4>
                  <span className="text-[9px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-cyan-400 font-mono font-bold shrink-0">
                    {item.duration}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 pl-6 leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              playBeep(660, 0.2);
              setSessionPhase('finish');
            }}
            className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-950 font-extrabold py-4 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm cursor-pointer shadow-lg active:scale-[0.98]"
          >
            <span>Simpan Hasil Latihan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Tampilan Layar Selesai (Simpan Hasil)
  if (sessionPhase === 'finish') {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-lime-500/10 rounded-full blur-3xl"></div>
          
          <div className="w-20 h-20 bg-lime-950/40 border-2 border-lime-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-lime-500/10 scale-110 transition duration-500">
            <CheckCircle2 className="w-10 h-10 text-lime-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Workout Selesai!</h2>
            <p className="text-sm text-zinc-400 max-w-[280px] mx-auto leading-relaxed font-sans">
              Kerja bagus! Sesi pemanasan, latihan inti, dan pendinginan telah diselesaikan secara lengkap hari ini.
            </p>
          </div>

          {/* Form Catatan */}
          <div className="space-y-2 text-left pt-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Catatan Sesi (Opsional)
            </label>
            <textarea
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition h-20 resize-none"
              placeholder="Contoh: Sangat lancar, negative pull-up terasa lebih ringan, berhasil menambah durasi plank..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleSaveWorkout}
            disabled={loading}
            className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-950 font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-lime-500/10"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            <span>Simpan Progress Latihan</span>
          </button>
        </div>
      </div>
    );
  }

  // Persentase progres latihan hari ini
  const progressPercent = Math.round(
    ((currentExerciseIdx) / totalExercises) * 100
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-2 space-y-6">
      {/* Header Workout */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancelWorkout}
          className="flex items-center space-x-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Keluar Sesi</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => setIsSoundEnabled(!isSoundEnabled)}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          title={isSoundEnabled ? "Matikan Suara" : "Aktifkan Suara"}
        >
          {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
          <span>Progres Latihan</span>
          <span>{currentExerciseIdx + 1} / {totalExercises} Gerakan</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-lime-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent || 5}%` }}
          ></div>
        </div>
      </div>

      {/* Active Workout Focus Card */}
      {!isResting ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Badge & Info */}
          <div className="flex justify-between items-center">
            <span className="bg-lime-950/30 text-lime-400 border border-lime-800/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {activeExercise.Kategori || 'Calisthenics'}
            </span>
            <span className="text-xs font-bold text-zinc-500">
              Set {currentSet} dari {activeExercise.Set}
            </span>
          </div>

          {/* Exercise Info */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-zinc-100">{activeExercise.NamaGerakan}</h2>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-sm">
              <Dumbbell className="w-4 h-4" />
              <span>Target: {activeExercise.Reps}</span>
            </div>
          </div>

          {/* Form Guide/Description */}
          <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Deskripsi Singkat:</span>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              {activeExercise.Deskripsi}
            </p>

            {/* Accordion Detail Langkah */}
            {activeExercise.Langkah && activeExercise.Langkah.length > 0 && (
              <div className="border-t border-zinc-800/60 pt-2.5 mt-2.5">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center justify-between w-full text-left text-xs font-bold text-cyan-400 hover:text-cyan-300 transition focus:outline-none cursor-pointer"
                >
                  <span>Lihat Langkah Detail Gerakan</span>
                  <span className="text-[10px]">{showDetails ? '▲ Tutup' : '▼ Pelajari Form'}</span>
                </button>
                
                {showDetails && (
                  <ol className="list-decimal pl-4 pt-2.5 space-y-1.5 text-xs text-zinc-400 leading-relaxed">
                    {activeExercise.Langkah.map((step, sIdx) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleFinishSet}
            className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-950 font-bold py-4 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm cursor-pointer shadow-lg shadow-lime-500/5 hover:shadow-lime-500/10 active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Selesaikan Set {currentSet}</span>
          </button>
        </div>
      ) : (
        /* REST TIMER MODAL IN-PLACE */
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 transition-all duration-1000" style={{ width: `${(restTimeLeft / (parseInt(activeExercise.Istirahat) || 60)) * 100}%` }}></div>
          
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">
              Waktu Istirahat
            </span>
            <p className="text-xs text-zinc-400">Rilekskan otot Anda sebelum set berikutnya</p>
          </div>

          {/* Timer Display */}
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            {/* Background Circle */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-zinc-800 fill-none"
                strokeWidth="6"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-cyan-400 fill-none transition-all duration-1000"
                strokeWidth="6"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * restTimeLeft) / (parseInt(activeExercise.Istirahat) || 60)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-3xl font-bold font-mono text-zinc-100">
              {restTimeLeft}s
            </div>
          </div>

          {/* Next Exercise Info */}
          <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-3 text-left">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Selanjutnya:</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs font-semibold text-zinc-300">
                {currentSet < activeExercise.Set 
                  ? `${activeExercise.NamaGerakan} (Set ${currentSet + 1})`
                  : currentExerciseIdx < totalExercises - 1
                    ? workoutList[currentExerciseIdx + 1].NamaGerakan
                    : 'Workout Selesai!'}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {currentSet < activeExercise.Set 
                  ? activeExercise.Reps 
                  : currentExerciseIdx < totalExercises - 1
                    ? workoutList[currentExerciseIdx + 1].Reps
                    : ''}
              </span>
            </div>
          </div>

          {/* Skip Button */}
          <button
            onClick={skipRest}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-3 rounded-xl transition text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Lewati Istirahat</span>
          </button>
        </div>
      )}

      {/* Exercise Queue Preview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Daftar Gerakan Hari Ini
        </h3>
        <div className="space-y-2">
          {workoutList.map((ex, idx) => {
            const isCompleted = idx < currentExerciseIdx;
            const isActive = idx === currentExerciseIdx;
            return (
              <div 
                key={idx}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs transition ${
                  isActive 
                    ? 'bg-lime-950/15 border-lime-500/40 text-lime-300 font-semibold' 
                    : isCompleted
                      ? 'bg-zinc-950/40 border-zinc-850/60 text-zinc-500 line-through'
                      : 'bg-zinc-950/20 border-zinc-850/30 text-zinc-400'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] ${
                    isActive
                      ? 'bg-lime-500 text-zinc-950 font-bold'
                      : isCompleted
                        ? 'bg-zinc-800 text-zinc-600'
                        : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}>
                    {idx + 1}
                  </span>
                  <span>{ex.NamaGerakan}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono opacity-80">{ex.Set} Set x {ex.Reps}</span>
                  {isCompleted && <CheckCircle2 className="w-4 h-4 text-zinc-600 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
