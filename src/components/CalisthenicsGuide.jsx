import React from 'react';
import { BookOpen, Flame, ShieldAlert, Coffee, Dumbbell } from 'lucide-react';
import { NUTRI_TIPS } from '../utils/mockData';

export default function CalisthenicsGuide() {
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
    </div>
  );
}
