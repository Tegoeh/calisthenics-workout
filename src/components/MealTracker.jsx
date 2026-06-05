import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Flame, RefreshCw, AlertCircle, HelpCircle, Check, Sparkles, Trash2, Calendar, ChevronDown, ChevronUp, Plus } from 'lucide-react';

export default function MealTracker({ 
  webAppUrl, 
  connectionStatus,
  mealHistory = [],
  onLogMeal,
  onDeleteMeal
}) {
  const [image, setImage] = useState(null);
  const [expandedRecipe, setExpandedRecipe] = useState(null);
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

          {/* Tombol Simpan/Catat */}
          <button
            onClick={() => {
              onLogMeal(result);
              handleReset();
            }}
            className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-950 font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm cursor-pointer shadow-lg active:scale-[0.99]"
          >
            <Check className="w-4 h-4" />
            <span>Catat & Tambahkan ke Konsumsi Hari Ini</span>
          </button>

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

      {/* List Makanan Hari Ini */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2.5">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-350">Makanan yang Dicatat Hari Ini</h3>
        </div>
        
        {(() => {
          const todayStr = new Date().toISOString().split('T')[0];
          const todayMeals = mealHistory.filter(meal => {
            const mealDateStr = new Date(meal.timestamp).toISOString().split('T')[0];
            return mealDateStr === todayStr;
          });
          
          if (todayMeals.length === 0) {
            return (
              <p className="text-xs text-zinc-500 text-center py-6 bg-zinc-950/20 border border-dashed border-zinc-850 rounded-xl">
                Belum ada makanan yang dicatat untuk hari ini.
              </p>
            );
          }
          
          return (
            <div className="space-y-3">
              {todayMeals.map((meal) => (
                <div 
                  key={meal.id} 
                  className="bg-zinc-950/40 border border-zinc-850/80 rounded-xl p-3.5 flex items-center justify-between group hover:border-zinc-800 transition"
                >
                  <div className="space-y-1 pr-4">
                    <h4 className="text-xs font-bold text-zinc-200 leading-tight">{meal.foodName}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-500 font-mono">
                      <span className="text-cyan-400 font-semibold">{meal.calories} kkal</span>
                      <span>•</span>
                      <span>Protein: <span className="text-lime-400 font-semibold">{meal.protein}g</span></span>
                      <span>•</span>
                      <span>Karb: {meal.carbs}g</span>
                      <span>•</span>
                      <span>Lemak: {meal.fat}g</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onDeleteMeal(meal.id)}
                    className="p-2 bg-zinc-900/60 border border-zinc-850 hover:bg-red-950/20 hover:border-red-900/30 text-zinc-500 hover:text-red-400 rounded-lg transition shrink-0 cursor-pointer"
                    title="Hapus catatan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Rekomendasi Surplus Kalori (Ektomorf Booster) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-5 h-5 text-lime-400" />
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-200">
              Rekomendasi Surplus Kalori (Ektomorf Booster)
            </h3>
            <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">
              Camilan & minuman sehat padat energi tinggi kalori untuk program bulking.
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {[
            {
              name: "Super Bulk Shake",
              calories: 850,
              protein: 35,
              carbs: 95,
              fat: 36,
              ingredients: [
                "1 buah Pisang Raja besar",
                "2 sdm Selai Kacang murni",
                "400ml Susu Sapi Full Cream",
                "35g Oatmeal (diblender halus)",
                "1 sdm Madu alami"
              ],
              steps: [
                "Blender oatmeal kering terlebih dahulu hingga menjadi tepung halus.",
                "Masukkan pisang, selai kacang, madu, dan tuangkan susu sapi full cream.",
                "Blender selama 1-2 menit hingga bertekstur kental dan lembut.",
                "Sajikan dingin. Minum setelah latihan atau sebelum tidur untuk surplus optimal."
              ]
            },
            {
              name: "Peanut Butter & Cheese Toast",
              calories: 480,
              protein: 16,
              carbs: 42,
              fat: 28,
              ingredients: [
                "2 lembar Roti Gandum",
                "2 sdm Selai Kacang murni",
                "1 slice Keju Cheddar",
                "1 sdt Mentega"
              ],
              steps: [
                "Panaskan sedikit mentega di wajan, panggang roti gandum hingga kecokelatan.",
                "Oleskan selai kacang murni di atas permukaan roti selagi hangat.",
                "Letakkan keju cheddar slice di bagian tengah roti tawar panggang.",
                "Sajikan hangat agar keju sedikit meleleh. Cocok untuk snack tinggi protein."
              ]
            },
            {
              name: "Almond & Dates Greek Yogurt",
              calories: 390,
              protein: 15,
              carbs: 48,
              fat: 16,
              ingredients: [
                "150g Greek Yogurt Plain",
                "5 butir Kurma (buang biji, potong kecil)",
                "10 butir Kacang Almond panggang",
                "1 sdm Madu alami"
              ],
              steps: [
                "Masukkan Greek yogurt ke dalam mangkok saji.",
                "Potong kurma menjadi bagian kecil dan cincang kasar kacang almond.",
                "Taburkan kurma, almond, dan sirami madu di atas Greek yogurt.",
                "Aduk rata sebelum dikonsumsi. Bagus untuk sumber protein lambat serap (kasein)."
              ]
            }
          ].map((recipe, idx) => {
            const isExpanded = expandedRecipe === idx;
            return (
              <div 
                key={idx} 
                className="bg-zinc-950/40 border border-zinc-850 rounded-xl overflow-hidden transition hover:border-zinc-800"
              >
                {/* Header Klik-able */}
                <div 
                  onClick={() => setExpandedRecipe(isExpanded ? null : idx)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-zinc-200">{recipe.name}</h4>
                    <div className="flex items-center space-x-2.5 text-[10px] text-zinc-500 font-mono">
                      <span className="text-cyan-400 font-bold">{recipe.calories} kkal</span>
                      <span>•</span>
                      <span>P: <span className="text-lime-400 font-semibold">{recipe.protein}g</span></span>
                      <span>•</span>
                      <span>K: {recipe.carbs}g</span>
                      <span>•</span>
                      <span>L: {recipe.fat}g</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Mencegah toggle ekspansi
                        onLogMeal({
                          foodName: recipe.name,
                          calories: recipe.calories,
                          protein: recipe.protein,
                          carbs: recipe.carbs,
                          fat: recipe.fat
                        });
                      }}
                      className="bg-lime-950/50 hover:bg-lime-900/60 border border-lime-900/30 text-lime-400 p-2 rounded-lg transition text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                      title="Catat langsung ke konsumsi hari ini"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Catat</span>
                    </button>
                    <div className="text-zinc-500 p-1.5">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-zinc-900 bg-zinc-950/20 p-4 space-y-4 text-xs animate-fadeIn">
                    {/* Bahan-bahan */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Bahan-bahan:</span>
                      <ul className="list-disc pl-4 space-y-1 text-zinc-400 leading-relaxed font-sans">
                        {recipe.ingredients.map((ing, iIdx) => (
                          <li key={iIdx}>{ing}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Cara Pembuatan */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Cara Pembuatan:</span>
                      <ol className="list-decimal pl-4 space-y-1 text-zinc-400 leading-relaxed font-sans">
                        {recipe.steps.map((step, sIdx) => (
                          <li key={sIdx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
