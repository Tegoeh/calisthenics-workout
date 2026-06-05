export const PROGRESSION_DATABASE = {
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

/**
 * Mencari gerakan calisthenics di dalam progression database berdasarkan pencocokan substring/nama.
 */
export function findExerciseInProgression(exerciseName) {
  if (!exerciseName) return null;
  const cleanName = exerciseName.toLowerCase();
  
  for (const categoryKey of Object.keys(PROGRESSION_DATABASE)) {
    const category = PROGRESSION_DATABASE[categoryKey];
    const foundIndex = category.levels.findIndex(level => {
      const levelName = level.name.toLowerCase();
      // Cocokkan apakah nama level ada di nama gerakan di jadwal atau sebaliknya
      return cleanName.includes(levelName) || levelName.includes(cleanName);
    });
    
    if (foundIndex !== -1) {
      return {
        categoryKey,
        categoryName: category.name,
        current: category.levels[foundIndex],
        next: foundIndex < category.levels.length - 1 ? category.levels[foundIndex + 1] : null,
        levels: category.levels,
        index: foundIndex
      };
    }
  }
  return null;
}

/**
 * Memetakan nama gerakan ke key kategori personalRecords di App.jsx
 */
export function mapExerciseToPRCategory(exerciseName) {
  if (!exerciseName) return null;
  const name = exerciseName.toLowerCase();
  
  if (name.includes('pullup') || name.includes('pull-up') || name.includes('row') || name.includes('hang')) {
    return 'pullup';
  }
  if (name.includes('pushup') || name.includes('push-up') || name.includes('press')) {
    return 'pushup';
  }
  if (name.includes('dips')) {
    return 'dips';
  }
  if (name.includes('l-sit') || name.includes('lsit') || name.includes('l sit')) {
    return 'lsit';
  }
  if (name.includes('plank')) {
    return 'plank';
  }
  if (name.includes('handstand')) {
    return 'handstand';
  }
  return null;
}

/**
 * Membuat langkah latihan default yang aman bagi gerakan baru yang di-upgrade
 */
export function generateDefaultLangkah(exerciseName, desc) {
  return [
    `Pahami teknik gerakan baru: ${exerciseName}.`,
    `Deskripsi gerakan: ${desc}`,
    "Lakukan pemanasan pergelangan tangan, bahu, dan lutut terlebih dahulu.",
    "Lakukan gerakan secara perlahan (form bersih), jangan mengayun atau memaksakan momentum.",
    "Fokus pada fase negatif (menurunkan badan secara lambat selama 2-3 detik) untuk membentuk adaptasi kekuatan.",
    "Beri istirahat yang cukup antara set (90-120 detik) untuk pemulihan optimal otot & saraf."
  ];
}
