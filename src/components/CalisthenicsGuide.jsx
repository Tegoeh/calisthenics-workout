import { useState } from 'react';
import { BookOpen, Flame, ShieldAlert, Dumbbell, Zap, Award, Calculator } from 'lucide-react';
import { NUTRI_TIPS } from '../utils/mockData';

const PROGRESSION_DATABASE = {
  push: {
    name: "Push (Menekan)",
    levels: [
      { name: "Wall Push-Up", threshold: 15, next: "Incline Push-Up", desc: "Push-up berdiri menghadap dinding. Sangat ringan untuk membiasakan sendi bahu." },
      { name: "Incline Push-Up", threshold: 12, next: "Regular Push-Up", desc: "Push-up dengan posisi tangan di ranjang/meja. Beban berkurang sekitar 30%." },
      { name: "Regular Push-Up", threshold: 12, next: "Pike Push-Up", desc: "Push-up standar di lantai. Target dada, triceps, dan core depan." },
      { name: "Pike Push-Up", threshold: 10, next: "Decline Push-Up", desc: "Posisi pinggul naik ke atas membentuk huruf V. Fokus beban pada otot bahu depan." },
      { name: "Decline Push-Up", threshold: 10, next: "Handstand Push-Up", desc: "Push-up dengan kaki dinaikkan ke ranjang/meja. Menambah beban penekanan dada atas." }
    ]
  },
  pull: {
    name: "Pull (Menarik)",
    levels: [
      { name: "Dead Hang", threshold: 45, next: "Australian Row", desc: "Hanya menggantung pasif pada bar untuk kekuatan genggaman (dalam detik)." },
      { name: "Australian Row", threshold: 12, next: "Scapula Pull-Up", desc: "Menarik badan horizontal di bawah meja/bar rendah." },
      { name: "Scapula Pull-Up", threshold: 12, next: "Negative Pull-Up", desc: "Menarik belikat saja saat menggantung untuk kekuatan trapezius bawah." },
      { name: "Negative Pull-Up", threshold: 8, next: "Regular Pull-Up", desc: "Fokus menahan beban saat turun (fase eksentrik) selama 3-5 detik." },
      { name: "Regular Pull-Up", threshold: 10, next: "L-Sit Pull-Up", desc: "Menarik dagu melewati bar secara vertikal. Target punggung dan bicep." }
    ]
  },
  legs: {
    name: "Legs (Kaki)",
    levels: [
      { name: "Assisted Squat", threshold: 15, next: "Bodyweight Squat", desc: "Squat dengan bantuan memegang tiang/meja untuk keseimbangan lutut." },
      { name: "Bodyweight Squat", threshold: 20, next: "Lunges", desc: "Squat standar tanpa beban tambahan. Menurunkan pantat hingga sejajar lutut." },
      { name: "Lunges", threshold: 15, next: "Archer Squat", desc: "Melangkah maju bergantian kaki untuk membagi beban secara sepihak." },
      { name: "Archer Squat", threshold: 12, next: "Pistol Squat (Assisted)", desc: "Squat melebar ke satu sisi untuk meningkatkan beban satu kaki secara bertahap." }
    ]
  },
  core: {
    name: "Core (Perut & Stabilisator)",
    levels: [
      { name: "Plank", threshold: 60, next: "Lying Leg Raise", desc: "Menahan tubuh lurus bertumpu pada siku lengan (dalam detik)." },
      { name: "Lying Leg Raise", threshold: 15, next: "Tuck L-Sit Hold", desc: "Mengangkat kaki lurus ke atas sambil berbaring telentang di lantai." },
      { name: "Tuck L-Sit Hold", threshold: 15, next: "Hanging Knee Raise", desc: "Menahan tubuh melayang dengan melipat lutut dekat dada di lantai (dalam detik)." },
      { name: "Hanging Knee Raise", threshold: 12, next: "Hanging Leg Raise", desc: "Menggantung di bar dan mengangkat lutut menekuk ke arah dada." }
    ]
  }
};

export default function CalisthenicsGuide() {
  const [selectedPattern, setSelectedPattern] = useState('push');
  const [selectedExerciseIdx, setSelectedExerciseIdx] = useState(0);
  const [maxPerformance, setMaxPerformance] = useState(8);
  const [calcResult, setCalcResult] = useState(null);

  // State baru untuk Kalkulator 1RM
  const [bodyWeight, setBodyWeight] = useState(60);
  const [addedWeight, setAddedWeight] = useState(10);
  const [repsDone, setRepsDone] = useState(5);
  const [oneRepMaxResult, setOneRepMaxResult] = useState(null);

  const calculate1RM = () => {
    const bw = Number(bodyWeight) || 0;
    const aw = Number(addedWeight) || 0;
    const reps = Number(repsDone) || 1;
    
    const totalLoad = bw + aw;
    const total1RM = totalLoad * (1 + reps / 30);
    const added1RM = Math.max(0, total1RM - bw);

    const targets = {
      strength: {
        percentage: "85% - 100%",
        desc: "Latihan Kekuatan Maksimal (1-5 reps)",
        load: Math.max(0, (total1RM * 0.90) - bw)
      },
      hypertrophy: {
        percentage: "70% - 80%",
        desc: "Latihan Hipertrofi / Otot (6-12 reps)",
        load: Math.max(0, (total1RM * 0.75) - bw)
      },
      endurance: {
        percentage: "50% - 65%",
        desc: "Latihan Daya Tahan / Endurance (15+ reps)",
        load: Math.max(0, (total1RM * 0.55) - bw)
      }
    };

    setOneRepMaxResult({
      total1RM: Math.round(total1RM),
      added1RM: Math.round(added1RM),
      targets
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 px-4 py-2">
      {/* Hero Welcome */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"></div>
        <div className="flex items-center space-x-3 mb-3">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-zinc-100">Panduan Kalistenik Pemula</h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Dirancang khusus untuk program akselerasi berat badan (hipertrofi) dan adaptasi tendon bagi profil kurus (Ektomorf). Ikuti prinsip-prinsip di bawah ini agar progres Anda aman dan maksimal!
        </p>
      </div>

      {/* Nutrisi & Kalori */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-md font-bold text-zinc-200 flex items-center space-x-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <span>Fokus Nutrisi & Bulking</span>
        </h3>
        
        <div className="grid gap-4">
          {NUTRI_TIPS.map((tip, idx) => (
            <div key={idx} className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 space-y-1">
              <h4 className="text-sm font-semibold text-cyan-300">{tip.title}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tendon & Pemulihan */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-md font-bold text-zinc-200 flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-lime-400" />
          <span>Keamanan Sendi & Tendon</span>
        </h3>
        
        <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-lime-950/50 border border-lime-800/40 text-lime-400 flex items-center justify-center font-bold">1</span>
            <p>
              <strong>Pemanasan Wajib:</strong> Lakukan mobilisasi pergelangan tangan, bahu, dan pinggul selama 5-10 menit sebelum memulai workout. Ini melumasi sendi dengan cairan sinovial.
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-lime-950/50 border border-lime-800/40 text-lime-400 flex items-center justify-center font-bold">2</span>
            <p>
              <strong>Form & Tempo &gt; Repetisi:</strong> Lakukan gerakan secara lambat dan terkendali. Hindari menghentak-hentak tubuh saat pull-up atau push-up untuk menghindari cedera ligamen.
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-lime-950/50 border border-lime-800/40 text-lime-400 flex items-center justify-center font-bold">3</span>
            <p>
              <strong>Nyeri Sendi vs Nyeri Otot:</strong> Jika merasakan nyeri tajam di pergelangan tangan, siku, atau bahu, segera HENTIKAN latihan. Nyeri otot (DOMS) itu wajar, tetapi nyeri sendi/tendon adalah tanda cedera.
            </p>
          </div>
        </div>
      </div>

      {/* Pola Latihan Fundamental */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-md font-bold text-zinc-200 flex items-center space-x-2">
          <Dumbbell className="w-5 h-5 text-cyan-400" />
          <span>Konsep Progressive Overload</span>
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Sebagai pemula dengan berat badan 45kg, tantangan terbesar Anda adalah membangun kekuatan dasar. Progres tidak selalu berarti menambah beban. Dalam kalistenik, Anda bisa menerapkan progressive overload dengan cara:
        </p>
        <ul className="text-xs text-zinc-400 space-y-2 pl-4 list-disc leading-relaxed">
          <li><strong>Meningkatkan Time Under Tension:</strong> Memperlambat fase negatif gerakan (misal: menurunkan tubuh saat pull-up selama 5 detik).</li>
          <li><strong>Memperbaiki Form:</strong> Bergerak dari range of motion parsial ke full range of motion (dada menempel ke lantai pada push-up).</li>
          <li><strong>Mempersingkat Istirahat:</strong> Mengurangi durasi istirahat antardetik secara bertahap dari 90 detik menjadi 60 detik.</li>
          <li><strong>Meningkatkan Repetisi:</strong> Jika hari ini sanggup 5 push-up bersih, targetkan 6 pada sesi berikutnya.</li>
        </ul>
      </div>

      {/* Kalkulator Level Progresi Gerakan */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-md font-bold text-zinc-200 flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
          <span>Kalkulator Level Progresi Gerakan</span>
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          Ketahui kapan Anda harus beralih ke variasi gerakan yang lebih berat untuk terus menstimulasi pertumbuhan otot dan menghindari stagnasi kekuatan (*progressive overload*).
        </p>

        <div className="space-y-3.5 bg-zinc-950/60 border border-zinc-850 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Dropdown Pola Gerakan */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Pola Gerakan
              </label>
              <select
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                value={selectedPattern}
                onChange={(e) => {
                  setSelectedPattern(e.target.value);
                  setSelectedExerciseIdx(0);
                  setCalcResult(null);
                }}
              >
                <option value="push">Menekan (Push)</option>
                <option value="pull">Menarik (Pull)</option>
                <option value="legs">Kaki (Legs)</option>
                <option value="core">Perut (Core)</option>
              </select>
            </div>

            {/* Dropdown Latihan Saat Ini */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Latihan Saat Ini
              </label>
              <select
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer text-ellipsis overflow-hidden"
                value={selectedExerciseIdx}
                onChange={(e) => {
                  setSelectedExerciseIdx(Number(e.target.value));
                  setCalcResult(null);
                }}
              >
                {PROGRESSION_DATABASE[selectedPattern].levels.map((item, idx) => (
                  <option key={idx} value={idx}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Input Performance */}
          <div className="grid grid-cols-2 gap-3 items-end text-xs">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                {PROGRESSION_DATABASE[selectedPattern].levels[selectedExerciseIdx].name.match(/Hang|Plank|Hold/i)
                  ? "Durasi Maksimal (Detik)"
                  : "Repetisi Bersih Maksimal"}
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 font-mono focus:outline-none focus:border-cyan-500"
                value={maxPerformance}
                onChange={(e) => {
                  setMaxPerformance(Number(e.target.value));
                  setCalcResult(null);
                }}
              />
            </div>
            
            <button
              onClick={() => {
                const exercise = PROGRESSION_DATABASE[selectedPattern].levels[selectedExerciseIdx];
                const perf = Number(maxPerformance);
                const threshold = exercise.threshold;
                
                let status = "adaptation";
                let statusText = "Fase Adaptasi Kekuatan";
                let statusColor = "bg-amber-950/40 text-amber-400 border-amber-800/30";
                let message = `Teruskan melatih ${exercise.name} untuk menyempurnakan form dan memperkuat tendon Anda. Belum direkomendasikan naik tingkat agar terhindar dari cedera.`;

                if (perf >= threshold) {
                  status = "ready";
                  statusText = "Siap Naik Tingkat";
                  statusColor = "bg-cyan-950/40 text-cyan-400 border-cyan-800/30";
                  message = `Luar biasa! Kemampuan Anda melakukan ${perf} ${exercise.name.match(/Hang|Plank|Hold/i) ? 'detik' : 'reps'} menunjukkan otot & persendian Anda telah sepenuhnya teradaptasi.`;
                } else if (perf >= Math.round(threshold * 0.6)) {
                  status = "hypertrophy";
                  statusText = "Fase Hipertrofi / Overload";
                  statusColor = "bg-lime-950/40 text-lime-400 border-lime-800/30";
                  message = `Bagus! Ini adalah rentang optimal Anda untuk merangsang pembentukan otot (hipertrofi). Jaga konsistensi repetisi pada rentang ini.`;
                }

                setCalcResult({
                  status,
                  statusText,
                  statusColor,
                  message,
                  currentName: exercise.name,
                  nextName: exercise.next,
                  nextDesc: exercise.next ? PROGRESSION_DATABASE[selectedPattern].levels.find(l => l.name === exercise.next)?.desc : ""
                });
              }}
              className="bg-lime-500 hover:bg-lime-400 text-zinc-950 font-bold py-3 px-4 rounded-lg transition text-xs cursor-pointer shadow active:scale-[0.98]"
            >
              Cek Kesiapan Progresi
            </button>
          </div>
        </div>

        {/* Output Hasil Kalkulasi */}
        {calcResult && (
          <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-4 space-y-3.5 animate-fadeIn">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Hasil Analisis</span>
              <span className={`text-[9px] font-bold uppercase tracking-wider border px-2.5 py-0.5 rounded-full ${calcResult.statusColor}`}>
                {calcResult.statusText}
              </span>
            </div>

            <p className="text-xs text-zinc-450 leading-relaxed font-sans">
              {calcResult.message}
            </p>

            {calcResult.nextName ? (
              <div className="border-t border-zinc-900 pt-3 space-y-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Langkah Progresi Berikutnya:</span>
                <div className="bg-zinc-900/40 border border-zinc-850 rounded-lg p-3 space-y-1">
                  <span className="text-xs font-bold text-lime-400 block">{calcResult.nextName}</span>
                  {calcResult.nextDesc && (
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">{calcResult.nextDesc}</p>
                  )}
                  <p className="text-[10px] text-cyan-400 font-medium pt-1 font-sans">
                    💡 Tips Transisi: Lakukan 1-2 set awal menggunakan {calcResult.nextName}, lalu selesaikan sisa set dengan {calcResult.currentName} hingga kekuatan Anda beradaptasi penuh.
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-t border-zinc-900 pt-3 flex items-start space-x-2 text-[10px] text-cyan-400 font-semibold bg-cyan-950/10 border border-cyan-900/30 p-3 rounded-lg font-sans">
                <Award className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                <span>Selamat! Anda telah mencapai puncak variasi dasar pada pola gerakan ini. Fokus ke penambahan rep/set atau mulailah latihan tingkat lanjut lainnya.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kalkulator 1-Rep Max (1RM) Weighted Calisthenics */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-md font-bold text-zinc-200 flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-amber-500 animate-pulse" />
          <span>Kalkulator 1-Rep Max (Weighted Calisthenics)</span>
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          Proyeksikan kekuatan maksimal satu repetisi (1RM) Anda dan dapatkan pembagian beban tertarget untuk latihan menggunakan sabuk beban (*weighted vest/dip belt*).
        </p>

        <div className="space-y-3.5 bg-zinc-950/60 border border-zinc-850 rounded-xl p-4">
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Input Berat Badan */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Berat Badan (kg)
              </label>
              <input
                type="number"
                min="10"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2.5 text-zinc-200 font-mono focus:outline-none focus:border-amber-500 text-center"
                value={bodyWeight}
                onChange={(e) => {
                  setBodyWeight(Number(e.target.value));
                  setOneRepMaxResult(null);
                }}
              />
            </div>

            {/* Input Beban Tambahan */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Beban Ekstra (kg)
              </label>
              <input
                type="number"
                min="0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2.5 text-zinc-200 font-mono focus:outline-none focus:border-amber-500 text-center"
                value={addedWeight}
                onChange={(e) => {
                  setAddedWeight(Number(e.target.value));
                  setOneRepMaxResult(null);
                }}
              />
            </div>

            {/* Input Repetisi */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Repetisi (Reps)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2.5 text-zinc-200 font-mono focus:outline-none focus:border-amber-500 text-center"
                value={repsDone}
                onChange={(e) => {
                  setRepsDone(Number(e.target.value));
                  setOneRepMaxResult(null);
                }}
              />
            </div>
          </div>

          <button
            onClick={calculate1RM}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 px-4 rounded-lg transition text-xs cursor-pointer shadow active:scale-[0.98] select-none"
          >
            Hitung 1RM & Target Beban
          </button>
        </div>

        {/* Output Hasil 1RM */}
        {oneRepMaxResult && (
          <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-4 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-2 gap-3 text-center border-b border-zinc-900 pb-3">
              <div className="bg-zinc-900/50 border border-zinc-850 p-2 rounded-lg">
                <span className="text-zinc-500 block text-[8px] uppercase font-bold mb-0.5">Beban Ekstra 1RM</span>
                <span className="text-sm font-extrabold text-amber-400 font-mono">+{oneRepMaxResult.added1RM} kg</span>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-850 p-2 rounded-lg">
                <span className="text-zinc-500 block text-[8px] uppercase font-bold mb-0.5">Total Beban 1RM</span>
                <span className="text-sm font-extrabold text-zinc-200 font-mono">{oneRepMaxResult.total1RM} kg</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Target Beban Tambahan Berdasarkan Zona:</span>
              
              {/* Strength Zone */}
              <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-zinc-200 flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span>Zona Kekuatan ({oneRepMaxResult.targets.strength.percentage})</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 block">{oneRepMaxResult.targets.strength.desc}</span>
                </div>
                <span className="font-bold font-mono text-zinc-300">+{Math.round(oneRepMaxResult.targets.strength.load)} kg</span>
              </div>

              {/* Hypertrophy Zone */}
              <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-zinc-200 flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-500"></span>
                    <span>Zona Hipertrofi ({oneRepMaxResult.targets.hypertrophy.percentage})</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 block">{oneRepMaxResult.targets.hypertrophy.desc}</span>
                </div>
                <span className="font-bold font-mono text-lime-400">+{Math.round(oneRepMaxResult.targets.hypertrophy.load)} kg</span>
              </div>

              {/* Endurance Zone */}
              <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-zinc-200 flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                    <span>Zona Daya Tahan ({oneRepMaxResult.targets.endurance.percentage})</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 block">{oneRepMaxResult.targets.endurance.desc}</span>
                </div>
                <span className="font-bold font-mono text-zinc-300">+{Math.round(oneRepMaxResult.targets.endurance.load)} kg</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
