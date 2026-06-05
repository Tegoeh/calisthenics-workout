import React, { useState } from 'react';
import { Database, CheckCircle, XCircle, RefreshCw, HelpCircle, Save } from 'lucide-react';

export default function Settings({ webAppUrl, setWebAppUrl, onTestConnection, connectionStatus, loading }) {
  const [urlInput, setUrlInput] = useState(webAppUrl);
  const [testResult, setTestResult] = useState(null);

  const handleSave = () => {
    setWebAppUrl(urlInput);
    localStorage.setItem('calisthenics_web_app_url', urlInput);
    setTestResult({ type: 'success', message: 'URL berhasil disimpan ke penyimpanan lokal!' });
  };

  const handleTest = async () => {
    if (!urlInput) {
      setTestResult({ type: 'error', message: 'Masukkan URL Web App terlebih dahulu!' });
      return;
    }
    setTestResult(null);
    const success = await onTestConnection(urlInput);
    if (success) {
      setTestResult({ type: 'success', message: 'Koneksi ke Google Sheets Berhasil! Data jadwal & progress sinkron.' });
    } else {
      setTestResult({ type: 'error', message: 'Koneksi Gagal. Pastikan URL benar dan izin akses Google Apps Script telah disetel ke "Anyone".' });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 px-4 py-2">
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
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan URL</span>
          </button>
          
          <button
            onClick={handleTest}
            disabled={loading}
            className="flex-1 bg-lime-500 hover:bg-lime-400 text-zinc-950 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2 text-sm disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
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
