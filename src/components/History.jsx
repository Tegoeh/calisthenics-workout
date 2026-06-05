import React from 'react';
import { Calendar, CheckCircle2, History as HistoryIcon, Info, TrendingUp, Scale } from 'lucide-react';

function WeightChart({ weightHistory }) {
  if (!weightHistory || weightHistory.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center shadow-xl space-y-3">
        <Scale className="w-8 h-8 text-zinc-700 mx-auto" />
        <h3 className="text-sm font-semibold text-zinc-400">Belum ada riwayat berat badan</h3>
        <p className="text-xs text-zinc-500 max-w-[250px] mx-auto">
          Perbarui berat badan Anda di menu database untuk melihat grafik perkembangan.
        </p>
      </div>
    );
  }

  // Urutkan riwayat dari yang terlama ke terbaru untuk digambar di grafik
  const sortedWeightHistory = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Let's format the date labels
  const formatDateLabel = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    } catch (e) {
      return dateStr;
    }
  };

  // Dimensions
  const svgWidth = 500;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const weights = sortedWeightHistory.map(d => d.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  
  // Padding for min/max to avoid line touching the very top/bottom
  const yMin = Math.max(0, Math.floor(minW) - 1);
  const yMax = Math.ceil(maxW) + 1;
  const yRange = yMax - yMin || 1;

  // Generate coordinates
  const points = sortedWeightHistory.map((item, idx) => {
    const x = paddingLeft + (idx / (sortedWeightHistory.length - 1 || 1)) * chartWidth;
    const y = paddingTop + (1 - (item.weight - yMin) / yRange) * chartHeight;
    return { x, y, weight: item.weight, date: item.date };
  });

  // SVG paths
  let linePath = "";
  let areaPath = "";

  if (points.length > 0) {
    if (points.length === 1) {
      // Single point, draw a horizontal line across
      const y = points[0].y;
      linePath = `M ${paddingLeft} ${y} L ${paddingLeft + chartWidth} ${y}`;
      areaPath = `M ${paddingLeft} ${svgHeight - paddingBottom} L ${paddingLeft} ${y} L ${paddingLeft + chartWidth} ${y} L ${paddingLeft + chartWidth} ${svgHeight - paddingBottom} Z`;
    } else {
      // Multi-point line path
      linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
      // Area path closing at the bottom of the chart
      areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`;
    }
  }

  // Grid lines (3 horizontal lines)
  const gridLines = [];
  const gridCount = 3;
  for (let i = 0; i <= gridCount; i++) {
    const ratio = i / gridCount;
    const y = paddingTop + ratio * chartHeight;
    const val = yMax - ratio * yRange;
    gridLines.push({ y, value: val.toFixed(1) });
  }

  // Hitung selisih
  const startW = sortedWeightHistory[0].weight;
  const endW = sortedWeightHistory[sortedWeightHistory.length - 1].weight;
  const change = endW - startW;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">
      <div className="absolute top-0 right-0 w-24 h-24 bg-lime-500/5 rounded-full blur-2xl"></div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2.5">
          <TrendingUp className="w-5 h-5 text-lime-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-350">Grafik Kenaikan Berat Badan</h3>
        </div>
        <span className="text-[10px] font-extrabold text-lime-400 bg-lime-950/30 border border-lime-800/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Progres BB
        </span>
      </div>

      {/* Summary Info */}
      <div className="grid grid-cols-3 gap-2 bg-zinc-950/60 border border-zinc-850 rounded-xl p-3 text-center">
        <div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Mulai</span>
          <span className="text-xs font-extrabold text-zinc-350 font-mono">{startW.toFixed(1)} kg</span>
        </div>
        <div className="border-l border-zinc-850">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Terkini</span>
          <span className="text-xs font-extrabold text-lime-400 font-mono">{endW.toFixed(1)} kg</span>
        </div>
        <div className="border-l border-zinc-850">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Progres</span>
          <span className={`text-xs font-extrabold font-mono ${change >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)} kg
          </span>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="w-full min-w-[320px] h-auto overflow-visible"
        >
          {/* Gradients definitions */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(132, 204, 22)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(132, 204, 22)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={line.y} 
                x2={svgWidth - paddingRight} 
                y2={line.y} 
                className="stroke-zinc-800/80" 
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 8} 
                y={line.y + 3} 
                className="fill-zinc-500 font-mono text-[9px]" 
                textAnchor="end"
              >
                {line.value} kg
              </text>
            </g>
          ))}

          {/* Area Path */}
          {areaPath && (
            <path 
              d={areaPath} 
              fill="url(#chartGradient)" 
            />
          )}

          {/* Line Path */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              className="stroke-lime-500" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx}>
              {/* Outer glow ring */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="6" 
                className="fill-lime-400/10 stroke-none" 
              />
              {/* Inner dot */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="3" 
                className="fill-lime-400 stroke-zinc-950" 
                strokeWidth="1"
              />
              {/* Value Label above dot */}
              <text 
                x={p.x} 
                y={p.y - 8} 
                className="fill-zinc-350 font-mono text-[9px] font-bold" 
                textAnchor="middle"
              >
                {p.weight.toFixed(1)}
              </text>
              
              {/* Date Label on X Axis */}
              <text 
                x={p.x} 
                y={svgHeight - paddingBottom + 16} 
                className="fill-zinc-500 font-semibold text-[8px]" 
                textAnchor="middle"
              >
                {formatDateLabel(p.date)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function History({ progressHistory, weightHistory = [], connectionStatus }) {
  // Urutkan riwayat dari yang terbaru
  const sortedHistory = [...progressHistory].sort((a, b) => new Date(b.Tanggal) - new Date(a.Tanggal));

  return (
    <div className="max-w-xl mx-auto space-y-6 px-4 py-2">
      {/* Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-lime-500/10 rounded-full blur-xl"></div>
        <div className="flex items-center space-x-3 mb-2">
          <HistoryIcon className="w-6 h-6 text-lime-400" />
          <h2 className="text-xl font-bold text-zinc-100">Riwayat & Progress</h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Catatan konsistensi Anda. Semua sesi workout yang telah diselesaikan akan tercatat di sini dan disinkronkan dengan database Google Sheets Anda.
        </p>
      </div>

      {/* Weight progression chart */}
      <WeightChart weightHistory={weightHistory} />

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
