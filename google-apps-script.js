/**
 * Google Apps Script - Backend untuk Aplikasi Workout Calisthenics
 * Mengelola pembacaan jadwal latihan dan pencatatan riwayat (progress) langsung ke Google Sheets.
 * 
 * SETUP:
 * 1. Buat Spreadsheet baru di Google Sheets.
 * 2. Di Spreadsheet, buka Extensions > Apps Script.
 * 3. Hapus kode bawaan, lalu tempel kode ini.
 * 4. Klik ikon Simpan.
 * 5. Klik Deploy > New deployment.
 * 6. Pilih tipe "Web app".
 * 7. Setel:
 *    - Execute as: "Me" (Saya)
 *    - Who has access: "Anyone" (Siapa saja)
 * 8. Klik Deploy, berikan izin akses Google, lalu salin URL Web App yang dihasilkan.
 */

// Konstanta Nama Sheet
const SHEET_JADWAL = "Jadwal";
const SHEET_PROGRESS = "Progress";
const SHEET_MAKANAN = "Makanan";

/**
 * Endpoint GET: Membaca jadwal latihan dan riwayat progress terakhir
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetJadwal = ss.getSheetByName(SHEET_JADWAL);
    
    // Inisialisasi data default jika sheet Jadwal kosong/belum ada
    if (!sheetJadwal) {
      sheetJadwal = ss.insertSheet(SHEET_JADWAL);
      sheetJadwal.appendRow(["Hari", "Kategori", "NamaGerakan", "Set", "Reps", "Istirahat", "Deskripsi"]);
      
      const defaultData = [
        ["Senin", "Pull & Core", "Negative Pull-Up", "3", "5-8 reps", "90", "Lompat hingga dada sejajar bar, lalu turunkan tubuh selembut dan selambat mungkin (durasi 3-5 detik) hingga lengan lurus sepenuhnya. Sangat baik untuk membangun kekuatan awal menarik dan adaptasi tendon."],
        ["Senin", "Pull & Core", "Dead Hang", "3", "20-30 detik", "60", "Cukup gantung diam pada bar dengan genggaman penuh (jangan gunakan jari saja). Jaga bahu tetap aktif (scapula engaged). Bermanfaat memperkuat cengkeraman, pergelangan tangan, serta mendekompresi tulang belakang."],
        ["Senin", "Pull & Core", "Scapula Pull-Up", "3", "8-12 reps", "60", "Gantung lurus di bar, lalu angkat tubuh sedikit HANYA dengan menarik tulang belikat (scapula) ke bawah dan ke dalam. Tahan 1 detik di atas, lalu kembali ke posisi menggantung pasif. Siku harus tetap lurus."],
        ["Senin", "Pull & Core", "Plank", "3", "30-45 detik", "60", "Tumpukan berat badan pada lengan bawah dan ujung kaki. Jaga tubuh lurus sejajar dari kepala hingga tumit. Kencangkan perut (hollow body posture) dan bokong sepanjang waktu."],
        ["Senin", "Pull & Core", "Leg Raise (Lying)", "3", "8-12 reps", "60", "Berbaring telentang di lantai, tekan punggung bawah ke lantai (no arching). Angkat kaki lurus ke atas hingga membentuk sudut 90 derajat, lalu turunkan kembali secara perlahan hampir menyentuh lantai."],
        
        ["Rabu", "Push & Legs", "Incline Push-Up", "3", "8-12 reps", "90", "Lakukan push-up dengan menempatkan tangan di atas permukaan yang lebih tinggi (seperti kursi kokoh atau ranjang). Ini mempermudah beban push agar Anda dapat fokus melatih teknik menekan yang benar."],
        ["Rabu", "Push & Legs", "Regular Push-Up", "3", "5-8 reps", "90", "Push-up standar di lantai. Posisi siku membentuk sudut 45 derajat dari tubuh (jangan melebar ke samping). Pastikan dada hampir menyentuh lantai dan dorong hingga lengan lurus penuh."],
        ["Rabu", "Push & Legs", "Pike Push-Up", "3", "5-8 reps", "90", "Ambil posisi push-up lalu gerakkan kaki mendekati tangan hingga pinggul naik membentuk V terbalik. Tekuk siku ke belakang bawah secara diagonal sehingga kepala bergerak maju, lalu dorong kembali ke posisi awal. Melatih bahu."],
        ["Rabu", "Push & Legs", "Bodyweight Squat", "4", "12-15 reps", "90", "Berdiri tegak, turunkan pinggul ke belakang bawah seperti ingin duduk. Jaga dada tetap tegak dan tumit menempel erat di lantai. Turunlah sampai paha minimal sejajar lantai (deep squat jika mampu)."],
        ["Rabu", "Push & Legs", "Lunges", "3", "8-10 reps/kaki", "60", "Langkahkan kaki kanan ke depan, lalu turunkan lutut kiri hingga hampir menyentuh lantai (membentuk sudut 90 derajat di kedua lutut). Dorong kembali ke posisi awal, lalu gantilah dengan kaki kiri."],
        ["Rabu", "Push & Legs", "Calf Raises", "3", "15-20 reps", "60", "Berdiri tegak di lantai, angkat tumit setinggi mungkin hingga bertumpu pada ujung jari kaki. Tahan kontraksi 1 detik di posisi puncak, lalu turunkan tumit perlahan ke lantai."],
        
        ["Jumat", "Full Body", "Negative Pull-Up", "3", "5-8 reps", "90", "Fokus penuh pada fase eksentrik. Kontrol gerakan turun secara maksimal. Sesi ini memperkuat memori motorik otot penarik."],
        ["Jumat", "Full Body", "Regular Push-Up", "3", "8-10 reps", "90", "Push-up dengan kontrol tempo (2 detik turun, 1 detik dorong eksplosif) untuk memicu pertumbuhan serat otot (hipertrofi)."],
        ["Jumat", "Full Body", "Bench Dips", "3", "8-12 reps", "90", "Letakkan telapak tangan di tepi ranjang/kursi di belakang tubuh Anda. Kaki diluruskan di lantai. Tekuk siku ke belakang membentuk sudut 90 derajat, lalu dorong ke atas sampai siku lurus kembali. Bagus untuk triceps."],
        ["Jumat", "Full Body", "Tuck L-Sit Hold (Floor)", "3", "10-15 detik", "60", "Duduk di lantai dengan kaki ditekuk dekat dada. Letakkan tangan di samping paha, tekan kuat ke lantai untuk mengangkat pinggul dan kaki dari lantai. Jika terlalu berat, biarkan tumit tetap menyentuh lantai sedikit."],
        ["Jumat", "Full Body", "Bodyweight Squat", "3", "15 reps", "90", "Lakukan squat dengan teknik sempurna. Jaga stabilitas core Anda."],
        ["Jumat", "Full Body", "Plank", "3", "45 detik", "60", "Plank terakhir untuk menguji ketahanan core di akhir sesi latihan."]
      ];
      
      defaultData.forEach(row => sheetJadwal.appendRow(row));
    }
    
    // 1. Ambil data Jadwal
    const valuesJadwal = sheetJadwal.getDataRange().getValues();
    const headersJadwal = valuesJadwal[0];
    const jadwalList = [];
    for (let i = 1; i < valuesJadwal.length; i++) {
      const row = valuesJadwal[i];
      const item = {};
      for (let j = 0; j < headersJadwal.length; j++) {
        item[headersJadwal[j]] = row[j];
      }
      jadwalList.push(item);
    }
    
    // 2. Ambil data Progress (buat sheet jika belum ada)
    let sheetProgress = ss.getSheetByName(SHEET_PROGRESS);
    if (!sheetProgress) {
      sheetProgress = ss.insertSheet(SHEET_PROGRESS);
      sheetProgress.appendRow(["Tanggal", "HariWorkout", "Status", "Catatan"]);
    }
    
    const valuesProgress = sheetProgress.getDataRange().getValues();
    const headersProgress = valuesProgress[0];
    const progressList = [];
    for (let i = 1; i < valuesProgress.length; i++) {
      const row = valuesProgress[i];
      const item = {};
      for (let j = 0; j < headersProgress.length; j++) {
        item[headersProgress[j]] = row[j];
      }
      progressList.push(item);
    }
    
    // 3. Ambil data Makanan (buat sheet jika belum ada)
    let sheetMakanan = ss.getSheetByName(SHEET_MAKANAN);
    if (!sheetMakanan) {
      sheetMakanan = ss.insertSheet(SHEET_MAKANAN);
      sheetMakanan.appendRow(["Id", "Tanggal", "NamaMakanan", "Kalori", "Protein", "Karbohidrat", "Lemak", "Timestamp"]);
    }
    
    const valuesMakanan = sheetMakanan.getDataRange().getValues();
    const headersMakanan = valuesMakanan[0];
    const makananList = [];
    for (let i = 1; i < valuesMakanan.length; i++) {
      const row = valuesMakanan[i];
      const item = {};
      for (let j = 0; j < headersMakanan.length; j++) {
        item[headersMakanan[j]] = row[j];
      }
      makananList.push(item);
    }
    
    const responseData = {
      status: "success",
      jadwal: jadwalList,
      progress: progressList,
      makanan: makananList
    };
    
    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint POST: Mencatat progress baru ke sheet Progress
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Kunci script selama maksimal 10 detik agar tidak terjadi tumpang tindih tulis (concurrency lock)
  lock.tryLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetProgress = ss.getSheetByName(SHEET_PROGRESS);
    
    if (!sheetProgress) {
      sheetProgress = ss.insertSheet(SHEET_PROGRESS);
      sheetProgress.appendRow(["Tanggal", "HariWorkout", "Status", "Catatan"]);
    }
    
    // Parse body data
    const data = JSON.parse(e.postData.contents);
    
    // JIKA ACTION ADALAH ANALISIS MAKANAN DENGAN GEMINI AI
    if (data.action === "analyze_meal") {
      const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
      if (!apiKey) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "API Key Gemini belum diatur di Script Properties Apps Script."
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const models = [
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash"
      ];
      
      let lastError = "";
      let analysisText = "";
      
      for (let i = 0; i < models.length; i++) {
        const modelName = models[i];
        const url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;
        
        const payload = {
          contents: [
            {
              parts: [
                {
                  text: "Anda adalah ahli gizi olahraga dan pelatih calisthenics profesional. Analisis foto makanan ini. Berikan estimasi kalori total (kkal), protein (gram), karbohidrat (gram), lemak (gram), nama makanan, dan tips nutrisi ringkas untuk pembangun otot ektomorf (tinggi 172cm, BB 45kg) agar surplus kalori tercapai. Kembalikan respons dalam format JSON murni tanpa markdown code block, seperti: {\"foodName\": \"...\", \"calories\": 0, \"protein\": 0, \"carbs\": 0, \"fat\": 0, \"tips\": \"...\"}"
                },
                {
                  inlineData: {
                    mimeType: data.mimeType || "image/jpeg",
                    data: data.imageRaw
                  }
                }
              ]
            }
          ]
        };
        
        const options = {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        };
        
        try {
          const response = UrlFetchApp.fetch(url, options);
          const resText = response.getContentText();
          const resJson = JSON.parse(resText);
          
          if (resJson.candidates && resJson.candidates[0] && resJson.candidates[0].content.parts[0].text) {
            analysisText = resJson.candidates[0].content.parts[0].text;
            break; // Berhasil! Keluar dari loop pencarian model
          } else if (resJson.error) {
            lastError = "Model " + modelName + " error " + resJson.error.code + ": " + resJson.error.message;
            console.warn(lastError);
          } else {
            lastError = "Model " + modelName + " respon tidak terduga: " + resText;
            console.warn(lastError);
          }
        } catch (e) {
          lastError = "Model " + modelName + " gagal dipanggil: " + e.toString();
          console.warn(lastError);
        }
      }
      
      if (!analysisText) {
        throw new Error("Gagal menerima analisis valid dari Gemini API. Semua model (" + models.join(", ") + ") mengalami kendala limitasi. Detail kendala terakhir: " + lastError);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        analysis: analysisText
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // JIKA ACTION ADALAH MENCATAT MAKANAN
    if (data.action === "log_meal") {
      let sheetMakanan = ss.getSheetByName(SHEET_MAKANAN);
      if (!sheetMakanan) {
        sheetMakanan = ss.insertSheet(SHEET_MAKANAN);
        sheetMakanan.appendRow(["Id", "Tanggal", "NamaMakanan", "Kalori", "Protein", "Karbohidrat", "Lemak", "Timestamp"]);
      }
      sheetMakanan.appendRow([
        data.id,
        data.tanggal || new Date().toISOString().split('T')[0],
        data.foodName,
        data.calories,
        data.protein,
        data.carbs,
        data.fat,
        data.timestamp || new Date().toISOString()
      ]);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Makanan berhasil dicatat!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // JIKA ACTION ADALAH MENGHAPUS MAKANAN
    if (data.action === "delete_meal") {
      let sheetMakanan = ss.getSheetByName(SHEET_MAKANAN);
      if (sheetMakanan) {
        const values = sheetMakanan.getDataRange().getValues();
        for (let i = 1; i < values.length; i++) {
          if (values[i][0].toString() === data.id.toString()) {
            sheetMakanan.deleteRow(i + 1);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Catatan makanan berhasil dihapus!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ACTION DEFAULT: Simpan Progress Latihan
    const tanggal = data.tanggal || new Date().toISOString().split('T')[0];
    const hariWorkout = data.hariWorkout || "";
    const status = data.status || "Selesai";
    const catatan = data.catatan || "";
    
    // Tambahkan baris baru ke sheet Progress
    sheetProgress.appendRow([tanggal, hariWorkout, status, catatan]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Progres latihan berhasil dicatat!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
