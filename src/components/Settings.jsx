import { useState } from 'react';
import { Database, CheckCircle, XCircle, RefreshCw, HelpCircle, Save, Flame, Download } from 'lucide-react';

export default function Settings({ 
  webAppUrl, 
  setWebAppUrl, 
  defaultUrl,
  onTestConnection, 
  connectionStatus, 
  loading,
  targetCalories,
  setTargetCalories,
  targetProtein,
  setTargetProtein,
  weight,
  setWeight,
  height,
  setHeight,
  progressHistory = [],
  mealHistory = []
}) {
  const [urlInput, setUrlInput] = useState(webAppUrl);
  const [caloriesInput, setCaloriesInput] = useState(targetCalories);
  const [proteinInput, setProteinInput] = useState(targetProtein);
  const [weightInput, setWeightInput] = useState(weight);
  const [heightInput, setHeightInput] = useState(height);
  const [testResult, setTestResult] = useState(null);
  
  // States untuk Kalkulator Gizi
  const [showCalc, setShowCalc] = useState(false);
  const [calcAge, setCalcAge] = useState(20);
  const [calcActivity, setCalcActivity] = useState(1.55);
  const [calcSurplus, setCalcSurplus] = useState(500);
  const [calcProteinRatio, setCalcProteinRatio] = useState(2.0);

  const handleApplyCalculation = () => {
    const bmr = 10 * Number(weightInput) + 6.25 * Number(heightInput) - 5 * Number(calcAge) + 5;
    const tdee = bmr * Number(calcActivity);
    const calculatedCalories = Math.round(tdee + Number(calcSurplus));
    const calculatedProtein = Math.round(Number(weightInput) * Number(calcProteinRatio));

    setCaloriesInput(calculatedCalories);
    setProteinInput(calculatedProtein);
    setShowCalc(false);
  };

  const handleSave = () => {
    const trimmedUrl = urlInput.trim();
    setUrlInput(trimmedUrl);
    setWebAppUrl(trimmedUrl);
    localStorage.setItem('calisthenics_web_app_url', trimmedUrl);
    
    setTargetCalories(Number(caloriesInput));
    localStorage.setItem('calisthenics_target_calories', caloriesInput);

    setTargetProtein(Number(proteinInput));
    localStorage.setItem('calisthenics_target_protein', proteinInput);

    setWeight(Number(weightInput));
    setHeight(Number(heightInput));

    setTestResult({ type: 'success', message: 'Semua pengaturan & target berhasil disimpan!' });
  };

  const handleResetToDefault = () => {
    setUrlInput(defaultUrl);
    setWebAppUrl(defaultUrl);
    localStorage.setItem('calisthenics_web_app_url', defaultUrl);
    setTestResult({ type: 'success', message: 'URL database berhasil direset ke bawaan default yang valid!' });
  };

  const handleTest = async () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) {
      setTestResult({ type: 'error', message: 'Masukkan URL Web App terlebih dahulu!' });
      return;
    }
    setTestResult(null);
    const success = await onTestConnection(trimmedUrl);
    if (success) {
      setTestResult({ type: 'success', message: 'Koneksi ke Google Sheets Berhasil! Data jadwal & progress sinkron.' });
    } else {
      setTestResult({ type: 'error', message: 'Koneksi Gagal. Pastikan URL benar dan izin akses Google Apps Script telah disetel ke "Anyone".' });
    }
  };

  const downloadCSV = (dataArray, filename) => {
    const csvContent = "\uFEFF" + dataArray.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportWorkoutsToCSV = () => {
    if (!progressHistory || progressHistory.length === 0) {
      alert("Belum ada riwayat latihan untuk diekspor!");
      return;
    }
    
    const headers = ["Tanggal", "Hari Workout", "Status", "Catatan"];
    const rows = progressHistory.map(item => {
      const tanggal = item.Tanggal || item.tanggal || '';
      const hari = item.HariWorkout || item.hariWorkout || '';
      const status = item.Status || item.status || '';
      const catatan = item.Catatan || item.catatan || '';
      
      const escape = (text) => {
        if (text === null || text === undefined) return '';
        const stringVal = String(text);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      };
      
      return [
        escape(tanggal),
        escape(hari),
        escape(status),
        escape(catatan)
      ];
    });
    
    downloadCSV([headers, ...rows], `riwayat_workout_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportMealsToCSV = () => {
    if (!mealHistory || mealHistory.length === 0) {
      alert("Belum ada catatan makanan untuk diekspor!");
      return;
    }
    
    const headers = ["ID", "Nama Makanan", "Kalori (kkal)", "Protein (g)", "Karbohidrat (g)", "Lemak (g)", "Waktu"];
    const rows = mealHistory.map(item => {
      const id = item.id || '';
      const foodName = item.foodName || '';
      const calories = item.calories !== undefined ? item.calories : '';
      const protein = item.protein !== undefined ? item.protein : '';
      const carbs = item.carbs !== undefined ? item.carbs : '';
      const fat = item.fat !== undefined ? item.fat : '';
      const timestamp = item.timestamp || '';
      
      const escape = (text) => {
        if (text === null || text === undefined) return '';
        const stringVal = String(text);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      };
      
      return [
        escape(id),
        escape(foodName),
        escape(calories),
        escape(protein),
        escape(carbs),
        escape(fat),
        escape(timestamp)
      ];
    });
    
    downloadCSV([headers, ...rows], `catatan_makanan_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 px-4 py-2">
      {/* Target Nutrisi & Kalori Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl"></div>
        <div className="flex items-center space-x-3 mb-1">
          <Flame className="w-6 h-6 text-cyan-400 animate-pulse" />
          <h2 className="text-xl font-bold text-zinc-100">Target Kalori & Protein</h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Sesuaikan target nutrisi harian Anda untuk mengontrol surplus kalori dan kebutuhan protein Anda.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Target Kalori (kkal)
            </label>
            <input
              type="number"
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
              value={caloriesInput}
              onChange={(e) => setCaloriesInput(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Target Protein (g)
            </label>
            <input
              type="number"
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
              value={proteinInput}
              onChange={(e) => setProteinInput(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/60 pt-4 mt-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Berat Badan (kg)
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
              value={weightInput}
              onChange={(e) => setWeightInput(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Tinggi Badan (cm)
            </label>
            <input
              type="number"
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
              value={heightInput}
              onChange={(e) => setHeightInput(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Collapsible Calculator Section */}
        <div className="border-t border-zinc-800/60 pt-4 mt-2">
          <button
            onClick={() => setShowCalc(!showCalc)}
            className="flex items-center justify-between w-full text-left text-xs font-bold text-cyan-400 hover:text-cyan-300 transition focus:outline-none cursor-pointer"
          >
            <span>Kalkulator Surplus Gizi (Ektomorf Calculator)</span>
            <span className="text-[10px]">{showCalc ? '▲ Tutup' : '▼ Buka Kalkulator'}</span>
          </button>

          {showCalc && (
            <div className="mt-4 space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-850 animate-fadeIn text-xs">
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Gunakan kalkulator ilmiah ini untuk mengestimasi kebutuhan kalori harian (TDEE) Anda dan target surplus berdasarkan berat, tinggi, usia, dan tingkat keaktifan saat ini.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Usia Anda (tahun)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-cyan-500"
                    value={calcAge}
                    onChange={(e) => setCalcAge(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Rasio Protein (g/kg BB)
                  </label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    value={calcProteinRatio}
                    onChange={(e) => setCalcProteinRatio(Number(e.target.value))}
                  >
                    <option value={1.6}>1.6g/kg (Pemeliharaan)</option>
                    <option value={1.8}>1.8g/kg (Anabolik Sedang)</option>
                    <option value={2.0}>2.0g/kg (Anabolik Maksimal)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Tingkat Aktivitas Fisik
                  </label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    value={calcActivity}
                    onChange={(e) => setCalcActivity(Number(e.target.value))}
                  >
                    <option value={1.2}>Sedentary (Sangat jarang berolahraga)</option>
                    <option value={1.375}>Ringan (Olahraga ringan 1-2x/minggu)</option>
                    <option value={1.55}>Sedang (Olahraga calisthenics 3-4x/minggu)</option>
                    <option value={1.725}>Aktif (Olahraga intensif 5-6x/minggu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Target Surplus Kalori (Bulking Rate)
                  </label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    value={calcSurplus}
                    onChange={(e) => setCalcSurplus(Number(e.target.value))}
                  >
                    <option value={300}>Clean Bulk (+300 kkal / minggu lambat)</option>
                    <option value={500}>Moderate Bulk (+500 kkal / ideal ektomorf)</option>
                    <option value={700}>Aggressive Bulk (+700 kkal / peningkatan cepat)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyCalculation}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold py-2.5 px-4 rounded-xl transition text-[11px] cursor-pointer shadow active:scale-[0.98]"
              >
                Terapkan Hasil Kalkulasi ke Target
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-lime-500/10 rounded-full blur-2xl"></div>
        <div className="flex items-center space-x-3 mb-2">
          <Database className="w-6 h-6 text-lime-400" />
          <h2 className="text-xl font-bold text-zinc-100">Database Google Sheets</h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Hubungkan aplikasi calisthenics Anda langsung ke Google Sheets untuk mencatat riwayat workout dan memuat jadwal latihan secara dinamis.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            URL Google Apps Script Web App
          </label>
          <input
            type="url"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={handleSave}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan URL</span>
          </button>

          <button
            onClick={handleResetToDefault}
            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-medium py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Bawaan</span>
          </button>
          
          <button
            onClick={handleTest}
            disabled={loading}
            className="bg-lime-500 hover:bg-lime-400 text-zinc-950 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2 text-sm disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            <span>Tes Koneksi</span>
          </button>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-4 rounded-xl text-xs flex items-start space-x-2 border ${
            testResult.type === 'success' 
              ? 'bg-lime-950/20 border-lime-800 text-lime-300' 
              : 'bg-red-950/20 border-red-900 text-red-300'
          }`}>
            {testResult.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-lime-400 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Current Connection Status Badge */}
        <div className="border-t border-zinc-800/60 pt-4 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Status Sinkronisasi saat ini:</span>
          <div className="flex items-center space-x-1.5">
            {connectionStatus === 'connected' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
                <span className="font-semibold text-lime-400">Terhubung</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                <span className="font-semibold text-zinc-500">Offline (Simulasi Lokal)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cadangkan & Ekspor Data Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
        <div className="flex items-center space-x-3 mb-1">
          <Download className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold text-zinc-100">Cadangkan & Ekspor Data</h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Unduh semua riwayat latihan dan catatan makanan Anda dalam format CSV untuk cadangan atau dibuka di Excel/Spreadsheet.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={exportWorkoutsToCSV}
            className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2 text-sm cursor-pointer shadow active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Ekspor Riwayat Latihan</span>
          </button>

          <button
            onClick={exportMealsToCSV}
            className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2 text-sm cursor-pointer shadow active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Ekspor Catatan Makanan</span>
          </button>
        </div>
      </div>

      {/* Guide/Help Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-zinc-300">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold">Cara Mendapatkan URL Web App</h3>
        </div>
        
        <ol className="text-xs text-zinc-400 space-y-3 list-decimal pl-4 leading-relaxed">
          <li>
            Buka <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Google Sheets</a>, buat spreadsheet baru, lalu beri nama (contoh: <code>Workout Calisthenics DB</code>).
          </li>
          <li>
            Pilih menu <strong>Extensions (Ekstensi)</strong> &gt; <strong>Apps Script</strong>.
          </li>
          <li>
            Salin dan tempel kode <code>backend.js</code> yang kami sediakan ke editor Apps Script. Simpan proyek.
          </li>
          <li>
            Klik tombol <strong>Deploy (Terapkan)</strong> di bagian kanan atas &gt; pilih <strong>New deployment (Penerapan baru)</strong>.
          </li>
          <li>
            Pilih tipe deployment: <strong>Web app (Aplikasi web)</strong>.
          </li>
          <li>
            Setel <em>Execute as</em> ke <strong>Me (Saya)</strong>, dan <em>Who has access</em> ke <strong>Anyone (Siapa saja)</strong>. Ini penting agar frontend dapat berinteraksi tanpa auth kompleks.
          </li>
          <li>
            Klik <strong>Deploy</strong>, berikan izin akses Google (klik Advanced jika ada peringatan keamanan, lalu pilih Go to ...), lalu salin <strong>Web app URL</strong> yang dihasilkan.
          </li>
          <li>
            Kembali ke aplikasi ini dan tempelkan URL tersebut pada kolom input di atas, lalu klik <strong>Simpan & Tes Koneksi</strong>.
          </li>
        </ol>
      </div>
    </div>
  );
}
