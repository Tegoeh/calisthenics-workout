import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Flame, RefreshCw, AlertCircle, HelpCircle, Check, Sparkles } from 'lucide-react';

export default function MealTracker({ webAppUrl, connectionStatus }) {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isSimulated, setIsSimulated] = useState(false);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Menangani perubahan berkas gambar
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setError(null);
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Analisis Makanan (Fisik atau Simulasi)
  const handleAnalyze = async () => {
    if (!imagePreview) {
      setError("Silakan pilih atau ambil foto makanan terlebih dahulu!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setIsSimulated(false);

    // Ambil data base64 bersih (menghilangkan metadata "data:image/jpeg;base64,")
    const base64Data = imagePreview.split(',')[1];
    const mimeType = imagePreview.split(';')[0].split(':')[1];

    // Jika terhubung ke Google Sheets, kita kirim ke Apps Script
    if (connectionStatus === 'connected' && webAppUrl) {
      try {
        const response = await fetch(webAppUrl, {
          method: 'POST',
          mode: 'cors', // Kita minta cors karena ingin membaca response body analisis makanan
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({
            action: "analyze_meal",
            imageRaw: base64Data,
            mimeType: mimeType
          })
        });

        if (!response.ok) throw new Error("Gagal menghubungi server analisis Google Sheets");
        
        const data = await response.json();
        
        if (data.status === 'success' && data.analysis) {
          // Parse hasil analisis dari JSON string hasil Gemini
          const parsedResult = typeof data.analysis === 'string' 
            ? JSON.parse(data.analysis.replace(/```json/g, '').replace(/```/g, '').trim())
            : data.analysis;
          setResult(parsedResult);
        } else {
          // Tampilkan pesan error spesifik jika API gagal di Apps Script
          setError("Error Apps Script: " + (data.message || "Gagal melakukan analisis"));
        }
      } catch (err) {
        console.error("Gagal melakukan analisis API online:", err);
        setError("Koneksi Error: " + err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Jalankan simulasi offline instan
      setIsSimulated(true);
      setTimeout(() => {
        runSimulationAnalysis();
        setLoading(false);
      }, 2000);
    }
  };

  // Simulasi analisis makanan jika server offline/API Key belum disetel
  const runSimulationAnalysis = () => {
    // Kita tebak makanan berdasarkan ukuran file / acak untuk demo interaktif
    const simList = [
      {
        foodName: "Nasi Putih + Dada Ayam Panggang + Telur Rebus",
        calories: 680,
        protein: 48,
        carbs: 75,
        fat: 16,
        tips: "Menu luar biasa untuk Anda! Kadar protein sangat tinggi (48g) ideal untuk mempercepat sintesis protein otot pasca-latihan calisthenics. Kandungan karbohidrat kompleks dari nasi memberikan energi besar untuk adaptasi tendon."
      },
      {
        foodName: "Susu Full Cream + Pisang Raja + Selai Kacang",
        calories: 520,
        protein: 18,
        carbs: 68,
        fat: 22,
        tips: "Camilan padat kalori yang sangat baik bagi tipe tubuh kurus (Ektomorf). Kombinasi lemak sehat dari selai kacang dan kalium pisang mendukung pemulihan sendi dan mencegah kram otot."
      },
      {
        foodName: "Indomie Goreng + Telur Mata Sapi + Sosis",
        calories: 590,
        protein: 19,
        carbs: 62,
        fat: 29,
        tips: "Kalori cukup tinggi untuk surplus, namun kadar lemak jenuh dan sodiumnya terlalu tinggi. Kurang optimal untuk adaptasi tendon dan hipertrofi bersih. Disarankan ganti sosis dengan tempe/tahu bakar."
      }
    ];

    // Ambil acak dari daftar simulasi
    const randomIdx = Math.floor(Math.random() * simList.length);
    setResult(simList[randomIdx]);
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 px-4 py-2">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl"></div>
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-zinc-100 font-sans">Nutrisi AI (Meal Tracker)</h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Ambil foto makanan Anda menggunakan kamera HP. AI kami akan mengestimasi kandungan kalori, protein, lemak, dan karbohidrat secara instan khusus untuk program hipertrofi Anda.
        </p>
      </div>

      {/* Upload/Camera Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        {!imagePreview ? (
          /* Select Image Source Area */
          <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center bg-zinc-950/40 space-y-6">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
            />
            <input 
              type="file" 
              ref={cameraInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              capture="environment"
              className="hidden" 
            />
            
            <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-400 shadow-md">
              <Camera className="w-6 h-6" />
            </div>

            <div className="space-y-1 max-w-[280px] mx-auto">
              <h4 className="text-xs font-bold text-zinc-300">Unggah Makanan Anda</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Pilih apakah ingin memotret langsung dengan kamera HP Anda atau mengambil gambar dari penyimpanan galeri.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => cameraInputRef.current.click()}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 text-xs cursor-pointer shadow-md active:scale-[0.98]"
              >
                <Camera className="w-4 h-4" />
                <span>Foto Langsung (Kamera HP)</span>
              </button>
              
              <button
                onClick={() => fileInputRef.current.click()}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-3.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 text-xs cursor-pointer active:scale-[0.98]"
              >
                <ImageIcon className="w-4 h-4 text-zinc-400" />
                <span>Pilih dari Galeri</span>
              </button>
            </div>
          </div>
        ) : (
          /* Preview Area */
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 max-h-64 flex items-center justify-center bg-zinc-950">
              <img 
                src={imagePreview} 
                alt="Pratinjau Makanan" 
                className="max-h-64 object-contain" 
              />
              <button 
                onClick={handleReset}
                className="absolute top-3 right-3 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                Ubah Foto
              </button>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-cyan-500/5 hover:shadow-cyan-500/10 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Sedang Menganalisis Foto...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-zinc-950 fill-current" />
                  <span>Mulai Analisis Kandungan Nutrisi</span>
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-950/20 border border-red-900 text-red-300 p-3.5 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* AI Analysis Result Display */}
      {result && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn">
          {/* Badge & Title */}
          <div className="flex justify-between items-start border-b border-zinc-800/80 pb-4">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400">Hasil Deteksi AI</span>
              <h3 className="text-md font-bold text-zinc-100 mt-1">{result.foodName}</h3>
            </div>
            <div className="bg-cyan-950/30 border border-cyan-900/30 text-cyan-400 px-3 py-1 rounded-xl flex items-center space-x-1">
              <Flame className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-extrabold font-mono">{result.calories} kkal</span>
            </div>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Protein */}
            <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3.5 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 h-1 bg-lime-400 w-full"></div>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Protein</span>
              <span className="text-lg font-extrabold text-lime-400 mt-1 block font-mono">{result.protein}g</span>
              <span className="text-[8px] text-zinc-500 block mt-0.5">{(result.protein * 4)} kkal</span>
            </div>

            {/* Carbs */}
            <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3.5 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 h-1 bg-amber-400 w-full"></div>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Karbohidrat</span>
              <span className="text-lg font-extrabold text-amber-400 mt-1 block font-mono">{result.carbs}g</span>
              <span className="text-[8px] text-zinc-500 block mt-0.5">{(result.carbs * 4)} kkal</span>
            </div>

            {/* Fat */}
            <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3.5 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 h-1 bg-rose-500 w-full"></div>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Lemak</span>
              <span className="text-lg font-extrabold text-rose-400 mt-1 block font-mono">{result.fat}g</span>
              <span className="text-[8px] text-zinc-500 block mt-0.5">{(result.fat * 9)} kkal</span>
            </div>
          </div>

          {/* AI Tips for Ektomorf */}
          <div className="bg-zinc-950/50 border border-zinc-850 rounded-xl p-4 space-y-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Saran Gizi Calisthenics:</span>
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              {result.tips}
            </p>
          </div>

          {/* Sync status warning in result */}
          {isSimulated && (
            <div className="text-xs text-amber-300 bg-amber-950/20 border border-amber-900/60 p-4 rounded-xl space-y-1 mt-4">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mode Demonstrasi / Simulasi Lokal Aktif</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                Aplikasi belum mendeteksi konfigurasi API Key Gemini di Google Apps Script Anda (atau status database offline). Gambar tidak diproses oleh AI Vision asli, melainkan disimulasikan dari menu lokal secara acak. 
                <br/>
                <strong className="text-cyan-400 mt-1 block">Cara mengaktifkan AI asli: Dapatkan API Key Gemini gratis di Google AI Studio, lalu tambahkan sebagai properti skrip dengan nama GEMINI_API_KEY di pengaturan Apps Script Anda.</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
