import React from 'react';
import { Calendar, CheckCircle2, History as HistoryIcon, Info } from 'lucide-react';

export default function History({ progressHistory, connectionStatus }) {
  // Urutkan riwayat dari yang terbaru
  const sortedHistory = [...progressHistory].sort((a, b) => new Date(b.Tanggal) - new Date(a.Tanggal));

  return (
    <div className="max-w-xl mx-auto space-y-6 px-4 py-2">
      {/* Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-lime-500/10 rounded-full blur-xl"></div>
        <div className="flex items-center space-x-3 mb-2">
          <HistoryIcon className="w-6 h-6 text-lime-400" />
          <h2 className="text-xl font-bold text-zinc-100">Riwayat Latihan</h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Catatan konsistensi Anda. Semua sesi workout yang telah diselesaikan akan tercatat di sini dan disinkronkan dengan database Google Sheets Anda.
        </p>
      </div>

      {/* Warning/Offline Alert */}
      {connectionStatus !== 'connected' && (
        <div className="bg-amber-950/20 border border-amber-900/60 rounded-xl p-4 flex items-start space-x-3">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-300">Mode Penyimpanan Lokal Aktif</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Anda belum menghubungkan database Google Sheets di menu pengaturan. Riwayat saat ini disimpan di penyimpanan lokal browser Anda dan akan hilang jika cache dibersihkan.
            </p>
          </div>
        </div>
      )}

      {/* History Timeline */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        {sortedHistory.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Calendar className="w-12 h-12 text-zinc-700 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-400">Belum ada riwayat latihan</h3>
              <p className="text-xs text-zinc-500 max-w-[250px] mx-auto">
                Selesaikan sesi latihan hari ini di Dashboard untuk mencatatkan riwayat pertama Anda!
              </p>
            </div>
          </div>
        ) : (
          <div className="relative border-l border-zinc-850 ml-3 pl-6 space-y-6">
            {sortedHistory.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-zinc-900 border-2 border-lime-400 flex items-center justify-center transition group-hover:scale-110">
                  <div className="w-1.5 h-1.5 rounded-full bg-lime-400"></div>
                </div>

                {/* Content Card */}
                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 space-y-2 hover:border-zinc-700 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">
                        Workout {item.HariWorkout || 'Latihan'}
                      </h4>
                      <span className="text-[10px] text-zinc-500 flex items-center space-x-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        <span>{new Date(item.Tanggal).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </span>
                    </div>

                    <span className="bg-lime-950/40 text-lime-400 border border-lime-800/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{item.Status || 'Selesai'}</span>
                    </span>
                  </div>

                  {item.Catatan && (
                    <p className="text-xs text-zinc-400 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-850 font-sans italic">
                      "{item.Catatan}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
