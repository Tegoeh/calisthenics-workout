import { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, Play, CheckCircle2, ChevronRight, RefreshCw, Volume2, 
  VolumeX, ArrowLeft, FastForward, Mic, MicOff, Award, 
  Sparkles, Weight, ArrowUpCircle, ArrowDownCircle, Coins, Shield
} from 'lucide-react';
import { 
  findExerciseInProgression, 
  mapExerciseToPRCategory 
} from '../utils/progressionDb';

export default function WorkoutSession({ 
  day, 
  workoutList, 
  onFinishWorkout, 
  onCancelWorkout, 
  loading,
  personalRecords = { pullup: 0, pushup: 0, dips: 0, lsit: 0, plank: 0, handstand: 0 },
  onUpdatePR = () => {},
  weight = 45,
  weightHistory = [],
  progressHistory = [],
  onReplaceJadwalExercise = () => {},
  onRewardRPG = () => {},
  isDevMode = false
}) {
  const [sessionPhase, setSessionPhase] = useState('warmup'); // 'warmup' | 'workout' | 'cooldown' | 'finish'

  // RPG Boss Battle States
  const BOSSES = [
    { name: "Goblin", maxHp: 30, hp: 30, xpReward: 50, coinsReward: 20, badge: "Goblin Hunter", icon: "🔰", color: "bg-red-500" },
    { name: "Troll", maxHp: 60, hp: 60, xpReward: 150, coinsReward: 50, badge: "Troll Slayer", icon: "👹", color: "bg-amber-600" },
    { name: "Golem", maxHp: 100, hp: 100, xpReward: 300, coinsReward: 100, badge: "Golem Breaker", icon: "🗿", color: "bg-blue-600" },
    { name: "Dragon", maxHp: 180, hp: 180, xpReward: 600, coinsReward: 250, badge: "Dragon Slayer", icon: "🐉", color: "bg-purple-600" }
  ];

  const [selectedBossIdx, setSelectedBossIdx] = useState(0);
  const [bossHp, setBossHp] = useState(30);
  const [battleLog, setBattleLog] = useState(["Pertarungan akan dimulai. Bersiaplah!"]);
  const [customReps, setCustomReps] = useState({});
  const [damageDealtTotal, setDamageDealtTotal] = useState(0);
  const [rewardsClaimed, setRewardsClaimed] = useState(false);

  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // States untuk Auto-detect PR dan Up-level
  const parseTargetReps = (repsString) => {
    if (!repsString) return 10;
    const matches = repsString.match(/\d+/g);
    if (matches && matches.length > 0) {
      const numbers = matches.map(Number);
      return Math.max(...numbers);
    }
    return 10;
  };

  const [performanceData, setPerformanceData] = useState(() => {
    const initial = {};
    workoutList.forEach((ex, idx) => {
      initial[idx] = parseTargetReps(ex.Reps);
    });
    return initial;
  });

  const [upgradedExercises, setUpgradedExercises] = useState({});
  const [activeUpgradeInfo, setActiveUpgradeInfo] = useState(null);



  // State baru untuk Metronom Tempo Training
  const [isMetronomeEnabled, setIsMetronomeEnabled] = useState(false);
  const [tempoEccentric, setTempoEccentric] = useState(3);
  const [tempoIsometricBottom, setTempoIsometricBottom] = useState(1);
  const [tempoConcentric, setTempoConcentric] = useState(1);
  const [tempoIsometricTop, setTempoIsometricTop] = useState(0);
  const [metronomeSeconds, setMetronomeSeconds] = useState(0);

  function speakText(text) {
    if (isVoiceEnabled && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 1.15;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis failed:", e);
      }
    }
  }
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [jointAngle, setJointAngle] = useState(180);
  const [poseState, setPoseState] = useState('up');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const activeCameraRef = useRef(null);
  const activePoseRef = useRef(null);
  const poseStateRef = useRef('up');

  // Automatic clean up camera on unmount
  useEffect(() => {
    return () => {
      if (activeCameraRef.current) {
        try { activeCameraRef.current.stop(); } catch (err) { console.debug(err); }
      }
      if (activePoseRef.current) {
        try { activePoseRef.current.close(); } catch (err) { console.debug(err); }
      }
      const fallbackVideo = document.getElementById('ai-pose-video-fallback');
      if (fallbackVideo) {
        try {
          fallbackVideo.pause();
          if (fallbackVideo.srcObject) {
            const tracks = fallbackVideo.srcObject.getTracks();
            tracks.forEach(track => track.stop());
          }
        } catch (err) {
          console.debug(err);
        }
        fallbackVideo.remove();
      }
    };
  }, []);

  const calculateAngle = (a, b, c) => {
    if (!a || !b || !c) return 180;
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360.0 - angle;
    }
    return Math.round(angle);
  };

  const stopCameraTracker = () => {
    if (activeCameraRef.current) {
      try {
        activeCameraRef.current.stop();
      } catch (e) {
        console.warn("Error stopping camera:", e);
      }
      activeCameraRef.current = null;
    }
    if (activePoseRef.current) {
      try {
        activePoseRef.current.close();
      } catch (e) {
        console.warn("Error closing pose model:", e);
      }
      activePoseRef.current = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);

    const fallbackVideo = document.getElementById('ai-pose-video-fallback');
    if (fallbackVideo) {
      try {
        fallbackVideo.pause();
        if (fallbackVideo.srcObject) {
          const tracks = fallbackVideo.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }
      } catch (err) {
        console.debug("Error stopping fallback video tracks:", err);
      }
      fallbackVideo.remove();
    }
  };

  const startCameraTracker = async () => {
    if (typeof window.Pose === 'undefined' || typeof window.Camera === 'undefined') {
      alert("Model AI Tracker MediaPipe sedang di-load oleh browser atau gagal dimuat. Harap tunggu beberapa detik atau pastikan koneksi internet Anda stabil.");
      return;
    }

    setCameraLoading(true);
    try {
      const pose = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });

      pose.setOptions({
        modelComplexity: 0, // Lite Model untuk FPS tinggi & anti-lag di laptop/hp
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults((results) => {
        if (!canvasRef.current) return;
        const canvasCtx = canvasRef.current.getContext('2d');
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;

        canvasCtx.clearRect(0, 0, width, height);

        // Gambar video feed
        canvasCtx.drawImage(results.image, 0, 0, width, height);

        if (results.poseLandmarks) {
          const landmarks = results.poseLandmarks;

          // Keypoints Kiri
          const leftShoulder = landmarks[11];
          const leftElbow = landmarks[13];
          const leftWrist = landmarks[15];
          const leftHip = landmarks[23];
          const leftKnee = landmarks[25];
          const leftAnkle = landmarks[27];

          // Keypoints Kanan
          const rightShoulder = landmarks[12];
          const rightElbow = landmarks[14];
          const rightWrist = landmarks[16];
          const rightHip = landmarks[24];
          const rightKnee = landmarks[26];
          const rightAnkle = landmarks[28];

          // Deteksi jenis latihan dari nama gerakan
          const exName = activeExercise ? activeExercise.NamaGerakan.toLowerCase() : "";
          const isLegs = exName.includes("squat") || exName.includes("lunge") || exName.includes("calf");

          // Hitung sudut sendi secara adaptif dari sisi yang paling terlihat (visibility tertinggi)
          let angle = 180;
          if (isLegs) {
            const leftLegVis = (leftHip?.visibility || 0) + (leftKnee?.visibility || 0) + (leftAnkle?.visibility || 0);
            const rightLegVis = (rightHip?.visibility || 0) + (rightKnee?.visibility || 0) + (rightAnkle?.visibility || 0);
            if (leftLegVis >= rightLegVis) {
              angle = calculateAngle(leftHip, leftKnee, leftAnkle);
            } else {
              angle = calculateAngle(rightHip, rightKnee, rightAnkle);
            }
          } else {
            const leftArmVis = (leftShoulder?.visibility || 0) + (leftElbow?.visibility || 0) + (leftWrist?.visibility || 0);
            const rightArmVis = (rightShoulder?.visibility || 0) + (rightElbow?.visibility || 0) + (rightWrist?.visibility || 0);
            if (leftArmVis >= rightArmVis) {
              angle = calculateAngle(leftShoulder, leftElbow, leftWrist);
            } else {
              angle = calculateAngle(rightShoulder, rightElbow, rightWrist);
            }
          }

          setJointAngle(angle);

          // State Machine Rep Counter
          const limitDown = isLegs ? 115 : 100;
          const limitUp = isLegs ? 155 : 145;

          if (angle <= limitDown && poseStateRef.current === 'up') {
            poseStateRef.current = 'down';
            setPoseState('down');
            playBeep(440, 0.05); // Bip pendek di posisi bawah
          } else if (angle >= limitUp && poseStateRef.current === 'down') {
            poseStateRef.current = 'up';
            setPoseState('up');

            // Naik reps! Update customReps secara dinamis
            setCustomReps(prev => {
              const currentVal = prev[repsKey] !== undefined ? prev[repsKey] : parseTargetReps(activeExercise.Reps);
              const nextVal = currentVal + 1;

              // Kurangi HP bos secara real-time!
              setBossHp(bossPrev => Math.max(bossPrev - 1, 0));
              setDamageDealtTotal(damagePrev => damagePrev + 1);

              // Bunyikan beep sukses rep & voice feedback
              playBeep(880, 0.1);
              speakText(nextVal.toString());

              // Tambahkan battle log pertempuran
              const selectedBoss = BOSSES[selectedBossIdx];
              setBattleLog(logPrev => [
                `💥 Rep ke-${nextVal} ${activeExercise.NamaGerakan} mengenai ${selectedBoss.name}! (-1 HP)`,
                ...logPrev
              ].slice(0, 5));

              return { ...prev, [repsKey]: nextVal };
            });
          }

          // Gambar kerangka tubuh (skeleton) di canvas untuk interaktivitas RPG
          const drawLine = (p1, p2, color = '#22c55e', w = 3) => {
            if (!p1 || !p2) return;
            canvasCtx.beginPath();
            canvasCtx.moveTo(p1.x * width, p1.y * height);
            canvasCtx.lineTo(p2.x * width, p2.y * height);
            canvasCtx.strokeStyle = color;
            canvasCtx.lineWidth = w;
            canvasCtx.stroke();
          };

          const drawPoint = (p, color = '#3b82f6', r = 4) => {
            if (!p) return;
            canvasCtx.beginPath();
            canvasCtx.arc(p.x * width, p.y * height, r, 0, 2 * Math.PI);
            canvasCtx.fillStyle = color;
            canvasCtx.fill();
          };

          // Lengan Kiri (Shoulder - Elbow - Wrist)
          drawLine(leftShoulder, leftElbow, '#06b6d4', 3);
          drawLine(leftElbow, leftWrist, '#06b6d4', 3);

          // Lengan Kanan (Shoulder - Elbow - Wrist)
          drawLine(rightShoulder, rightElbow, '#06b6d4', 3);
          drawLine(rightElbow, rightWrist, '#06b6d4', 3);

          // Kaki Kiri (Hip - Knee - Ankle)
          drawLine(leftHip, leftKnee, '#22c55e', 3);
          drawLine(leftKnee, leftAnkle, '#22c55e', 3);

          // Kaki Kanan (Hip - Knee - Ankle)
          drawLine(rightHip, rightKnee, '#22c55e', 3);
          drawLine(rightKnee, rightAnkle, '#22c55e', 3);

          // Tubuh Kiri & Kanan (Shoulder - Hip)
          drawLine(leftShoulder, leftHip, '#84cc16', 3);
          drawLine(rightShoulder, rightHip, '#84cc16', 3);

          // Garis Bahu & Pinggul Penghubung Horizontal
          drawLine(leftShoulder, rightShoulder, '#e11d48', 2.5);
          drawLine(leftHip, rightHip, '#e11d48', 2.5);

          // Draw keypoints kiri
          drawPoint(leftShoulder, '#a855f7', 4.5);
          drawPoint(leftElbow, '#06b6d4', 5);
          drawPoint(leftWrist, '#3b82f6', 5);
          drawPoint(leftHip, '#84cc16', 4.5);
          drawPoint(leftKnee, '#22c55e', 5);
          drawPoint(leftAnkle, '#10b981', 5);

          // Draw keypoints kanan
          drawPoint(rightShoulder, '#a855f7', 4.5);
          drawPoint(rightElbow, '#06b6d4', 5);
          drawPoint(rightWrist, '#3b82f6', 5);
          drawPoint(rightHip, '#84cc16', 4.5);
          drawPoint(rightKnee, '#22c55e', 5);
          drawPoint(rightAnkle, '#10b981', 5);
        }
      });

      activePoseRef.current = pose;

      // Cari/tentukan video element secara dinamis untuk mencegah TypeError srcObject null
      let videoElement = videoRef.current;
      if (!videoElement) {
        videoElement = document.getElementById('ai-pose-video');
      }
      if (!videoElement) {
        videoElement = document.querySelector('video');
      }
      if (!videoElement) {
        console.warn("Video element not found. Creating dynamic fallback video element...");
        videoElement = document.createElement('video');
        videoElement.id = 'ai-pose-video-fallback';
        videoElement.setAttribute('playsinline', 'true');
        videoElement.muted = true;
        videoElement.style.position = 'absolute';
        videoElement.style.width = '1px';
        videoElement.style.height = '1px';
        videoElement.style.opacity = '0';
        videoElement.style.pointerEvents = 'none';
        document.body.appendChild(videoElement);
      }

      // Throttling 15 FPS untuk menghemat CPU/GPU & anti patah-patah
      let lastFrameTime = 0;
      const fpsLimit = 15;
      const frameInterval = 1000 / fpsLimit;

      // Start webcam stream
      const camera = new window.Camera(videoElement, {
        onFrame: async () => {
          const now = performance.now();
          if (now - lastFrameTime < frameInterval) return;
          lastFrameTime = now;

          if (videoElement && activePoseRef.current) {
            try {
              await activePoseRef.current.send({ image: videoElement });
            } catch (err) {
              console.debug("Error sending frame to pose model:", err);
            }
          }
        },
        width: 480,
        height: 360
      });

      activeCameraRef.current = camera;
      await camera.start();
      setIsCameraActive(true);
      setCameraLoading(false);
      speakText("Kamera pelacak AI aktif. Silakan posisikan tubuh Anda.");
    } catch (err) {
      console.error("Gagal mengaktifkan kamera pelacak:", err);
      alert("Gagal mengakses kamera. Pastikan Anda memberikan izin akses kamera ke browser.");
      stopCameraTracker();
    }
  };

  const timerRef = useRef(null);
  
  const activeExercise = workoutList[currentExerciseIdx];
  const totalExercises = workoutList.length;

  // Derive reps aktual untuk set saat ini secara dinamis (bebas dari useEffect cascading render)
  const repsKey = `${currentExerciseIdx}-${currentSet}`;
  const currentRepsValue = activeExercise ? (customReps[repsKey] !== undefined ? customReps[repsKey] : parseTargetReps(activeExercise.Reps)) : 10;

  const warmupItems = [
    {
      name: "Rotasi Sendi Bahu & Lengan",
      duration: "10-15 putaran",
      desc: "Putar bahu ke depan dan belakang secara perlahan untuk melumasi sendi peluru bahu."
    },
    {
      name: "Peregangan Pergelangan Tangan (Wrist Stretch)",
      duration: "30-45 detik",
      desc: "Lakukan peregangan pergelangan tangan di lantai dalam berbagai arah genggaman. Sangat penting bagi pemula calisthenics untuk menghindari cedera."
    },
    {
      name: "Scapula Shrugs (Active Hang)",
      duration: "10 repetisi",
      desc: "Tarik bahu ke atas dan ke bawah saat menggantung di bar untuk mengaktifkan belikat dan otot trapezius."
    },
    {
      name: "Bodyweight Squat Ringan",
      duration: "8-10 repetisi",
      desc: "Squat perlahan tanpa beban tambahan untuk memanaskan sendi lutut dan pinggul."
    },
    {
      name: "Jumping Jacks / Lari di Tempat",
      duration: "1 menit",
      desc: "Meningkatkan detak jantung secara bertahap dan menaikkan suhu tubuh inti sebelum menarik/mendorong beban tubuh."
    }
  ];

  const cooldownItems = [
    {
      name: "Peregangan Bahu (Shoulder Stretch)",
      duration: "30 detik/sisi",
      desc: "Tarik lengan menyilang dada dan tahan dengan tangan yang lain untuk meregangkan deltoid."
    },
    {
      name: "Peregangan Dada (Chest Stretch)",
      duration: "30 detik/sisi",
      desc: "Letakkan satu tangan pada dinding atau tiang bar, lalu putar tubuh berlawanan arah untuk meregangkan dada."
    },
    {
      name: "Child's Pose (Dekompresi Tulang Belakang)",
      duration: "1 menit",
      desc: "Duduk bertumpu pada tumit kaki, luruskan lengan ke depan lantai, dan letakkan dahi di lantai untuk menenangkan saraf dan mendekopresi tulang belakang."
    },
    {
      name: "Peregangan Pergelangan Tangan Pasif",
      duration: "30 detik",
      desc: "Tarik telapak tangan ke arah dalam untuk menenangkan tendon pergelangan tangan yang tegang pasca-gantungan."
    },
    {
      name: "Pernapasan Dalam (Deep Breathing)",
      duration: "1-2 menit",
      desc: "Tarik napas dalam dari hidung, keluarkan perlahan dari mulut untuk mengembalikan detak jantung ke kondisi istirahat (parasimpatis)."
    }
  ];

  // Bunyikan beep menggunakan Web Audio API
  function playBeep(frequency, duration) {
    if (!isSoundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("AudioContext failed to start: ", e);
    }
  }

  function goToNextStep() {
    if (currentSet < activeExercise.Set) {
      // Lanjut ke set berikutnya di gerakan yang sama
      setCurrentSet(prev => prev + 1);
    } else {
      // Jika set sudah habis, pindah ke gerakan berikutnya
      if (currentExerciseIdx < totalExercises - 1) {
        setCurrentExerciseIdx(prev => prev + 1);
        setCurrentSet(1);
        setShowDetails(false);
      } else {
        // Semua gerakan selesai, lanjut ke pendinginan
        setSessionPhase('cooldown');
        playBeep(523.25, 0.8); // Beep C5 untuk sukses besar
      }
    }
  }

  // Timer Countdown Effect
  useEffect(() => {
    if (isResting && restTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsResting(false);
            // Bunyi beep panjang menandakan istirahat selesai
            playBeep(880, 0.5);
            speakText("Mulai!");
            goToNextStep();
            return 0;
          }
          // Bunyi beep pendek di 3 detik terakhir
          if (prev === 4) {
            speakText("Tiga");
          } else if (prev === 3) {
            speakText("Dua");
          } else if (prev === 2) {
            speakText("Satu");
          }
          if (prev <= 4) {
            playBeep(440, 0.1);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResting, restTimeLeft]);

  // Effect untuk Metronom Tempo Training
  useEffect(() => {
    let metronomeInterval = null;
    if (sessionPhase === 'workout' && !isResting && isMetronomeEnabled) {
      metronomeInterval = setInterval(() => {
        setMetronomeSeconds(prev => {
          const totalDuration = tempoEccentric + tempoIsometricBottom + tempoConcentric + tempoIsometricTop;
          const nextSec = (prev + 1) % totalDuration;
          
          // Awal rep (sec = 0) berbunyi bip lebih tinggi (800Hz), ketukan tempo biasa bernada rendah (500Hz)
          const pitch = nextSec === 0 ? 800 : 500;
          playBeep(pitch, 0.05);

          return nextSec;
        });
      }, 1000);
    }

    return () => {
      if (metronomeInterval) clearInterval(metronomeInterval);
      setMetronomeSeconds(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPhase, isResting, isMetronomeEnabled, tempoEccentric, tempoIsometricBottom, tempoConcentric, tempoIsometricTop]);

  const handleFinishSet = () => {
    playBeep(660, 0.15);
    
    // Kurangi HP bos berdasarkan currentRepsValue
    const damage = Number(currentRepsValue || 0);
    setBossHp(prev => Math.max(prev - damage, 0));
    setDamageDealtTotal(prev => prev + damage);
    
    // Tambahkan battle log
    const selectedBoss = BOSSES[selectedBossIdx];
    const logMessage = `💥 Boom! Anda menyerang ${selectedBoss.name} dengan ${activeExercise.NamaGerakan} sebanyak ${damage} reps!`;
    
    setBattleLog(prev => [logMessage, ...prev].slice(0, 5));
    
    // Tentukan waktu istirahat (default ke 60 jika tidak disetel)
    const restDuration = parseInt(activeExercise.Istirahat) || 60;
    setRestTimeLeft(restDuration);
    setIsResting(true);
  };

  const skipRest = () => {
    clearInterval(timerRef.current);
    setIsResting(false);
    goToNextStep();
  };

  const handleSaveWorkout = () => {
    // Simpan PR baru secara otomatis jika performa yang dicapai melebihi PR lama
    workoutList.forEach((ex, idx) => {
      const prCategory = mapExerciseToPRCategory(ex.NamaGerakan);
      if (prCategory) {
        const perfVal = Number(performanceData[idx] || 0);
        const oldPR = Number(personalRecords[prCategory] || 0);
        if (perfVal > oldPR) {
          onUpdatePR(prCategory, perfVal);
        }
      }
    });

    onFinishWorkout(day, notes);
  };

  // 1. Tampilan Layar Pemanasan (Warm-Up)
  if (sessionPhase === 'warmup') {
    return (
      <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onCancelWorkout}
            className="flex items-center space-x-1.5 text-zinc-500 hover:text-zinc-350 text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Batalkan Sesi</span>
          </button>
          <span className="text-[10px] bg-amber-950/30 text-amber-400 border border-amber-850/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Fase 1: Pemanasan
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-zinc-150">Pemanasan Wajib (Warm-Up)</h2>
            <p className="text-xs text-zinc-455 leading-relaxed font-sans">
              Pemanasan sangat krusial untuk melumasi sendi belikat & pergelangan tangan, meregangkan otot secara aktif, dan mencegah ketegangan tendon berlebih.
            </p>
          </div>

          <div className="space-y-3.5">
            {warmupItems.map((item, idx) => (
              <div key={idx} className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-3.5 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono text-[9px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{item.name}</span>
                  </h4>
                  <span className="text-[9px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-amber-400 font-mono font-bold shrink-0">
                    {item.duration}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 pl-6 leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* RPG BOSS SELECT PANEL */}
          <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-4.5 space-y-3 text-left">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">⚔️ TANTANG BOS WORKOUT RPG</span>
            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
              Pilih bos yang ingin Anda lawan hari ini. Selesaikan repetisi set latihan Anda untuk memberikan damage dan mengalahkan bos!
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {BOSSES.map((boss, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setSelectedBossIdx(idx);
                    setBossHp(boss.maxHp);
                  }}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer relative overflow-hidden flex flex-col justify-between h-20 select-none ${
                    selectedBossIdx === idx 
                      ? 'bg-amber-950/15 border-amber-500/40 text-zinc-100' 
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-xl">{boss.icon}</span>
                    <span className="text-[8px] bg-zinc-950/60 border border-zinc-850 px-2 py-0.5 rounded font-mono font-bold text-zinc-400">
                      HP: {boss.maxHp}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-black block leading-none">{boss.name}</span>
                    <span className="text-[9px] text-amber-400 font-medium font-sans mt-1 block">
                      +{boss.xpReward} XP / +{boss.coinsReward} C
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              playBeep(660, 0.2);
              // Set awal HP Bos saat latihan dimulai
              setBossHp(BOSSES[selectedBossIdx].maxHp);
              setSessionPhase('workout');
            }}
            className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-950 font-extrabold py-4 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm cursor-pointer shadow-lg active:scale-[0.98]"
          >
            <span>Mulai Latihan Inti (Workout)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Tampilan Layar Pendinginan (Cool-Down)
  if (sessionPhase === 'cooldown') {
    return (
      <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
        <div className="flex justify-end">
          <span className="text-[10px] bg-cyan-950/30 text-cyan-400 border border-cyan-850/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Fase 3: Pendinginan
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-zinc-150">Pendinginan & Recovery (Cool-Down)</h2>
            <p className="text-xs text-zinc-455 leading-relaxed font-sans">
              Regangkan otot-otot Anda untuk merangsang proses perbaikan serat otot, meredakan stres saraf pusat, dan mengembalikan detak jantung ke kondisi istirahat.
            </p>
          </div>

          <div className="space-y-3.5">
            {cooldownItems.map((item, idx) => (
              <div key={idx} className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-3.5 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono text-[9px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{item.name}</span>
                  </h4>
                  <span className="text-[9px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-cyan-400 font-mono font-bold shrink-0">
                    {item.duration}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 pl-6 leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              playBeep(660, 0.2);
              setSessionPhase('finish');
            }}
            className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-950 font-extrabold py-4 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm cursor-pointer shadow-lg active:scale-[0.98]"
          >
            <span>Simpan Hasil Latihan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Tampilan Layar Selesai (Simpan Hasil)
  if (sessionPhase === 'finish') {
    // Hitung sesi terselesaikan untuk hari ini
    const sessionCount = progressHistory.filter(h => h.HariWorkout === day && h.Status === "Selesai").length + 1; // tambah 1 untuk sesi saat ini
    const initialWeight = weightHistory && weightHistory.length > 0 ? Number(weightHistory[0].weight) : weight;
    const weightDiff = Number((weight - initialWeight).toFixed(1));

    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 text-center shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-lime-500/10 rounded-full blur-3xl"></div>
          
          <div className="w-20 h-20 bg-lime-950/40 border-2 border-lime-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-lime-500/10 scale-110 transition duration-500">
            <CheckCircle2 className="w-10 h-10 text-lime-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Workout Selesai!</h2>
            <p className="text-sm text-zinc-400 max-w-[280px] mx-auto leading-relaxed font-sans">
              Kerja bagus! Sesi pemanasan, latihan inti, dan pendinginan telah diselesaikan secara lengkap hari ini.
            </p>
          </div>

          {/* Input Reps Aktual & Deteksi PR Otomatis */}
          <div className="space-y-3.5 text-left border-t border-b border-zinc-800/80 py-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-lime-400" />
              <span>Verifikasi Repetisi & Rekor Pribadi</span>
            </h3>
            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
              Masukkan reps atau durasi (detik) maksimal yang berhasil Anda selesaikan di set terbaik hari ini untuk mendeteksi Rekor Pribadi (PR) baru secara otomatis.
            </p>

            <div className="space-y-2.5 pt-1">
              {workoutList.map((ex, idx) => {
                const prCategory = mapExerciseToPRCategory(ex.NamaGerakan);
                const currentVal = Number(performanceData[idx] || 0);
                const oldPR = prCategory ? Number(personalRecords?.[prCategory] || 0) : 0;
                const isNewPR = prCategory && currentVal > oldPR;
                
                // Cari apakah ada level berikutnya di progressionDb
                const progInfo = findExerciseInProgression(ex.NamaGerakan);
                const hasNextLevel = progInfo && progInfo.next;
                const isUpgraded = upgradedExercises[ex.NamaGerakan];

                const isDuration = ex.Reps.toLowerCase().includes('detik') || ex.Reps.toLowerCase().includes('second') || ex.Reps.toLowerCase().includes('hang') || ex.Reps.toLowerCase().includes('hold');

                return (
                  <div key={idx} className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-zinc-200 block">{ex.NamaGerakan}</span>
                      <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-mono">
                        <span>Target: {ex.Reps}</span>
                        {prCategory && <span>• PR Lama: {oldPR} {isDuration ? 'detik' : 'reps'}</span>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                      {/* Live PR Badge */}
                      {isNewPR && (
                        <span className="bg-lime-950/40 text-lime-400 border border-lime-800/40 text-[9px] font-extrabold px-2 py-0.5 rounded-md animate-pulse uppercase tracking-wider flex items-center space-x-1 shrink-0">
                          <Sparkles className="w-2.5 h-2.5 fill-current" />
                          <span>PR Baru!</span>
                        </span>
                      )}

                      {/* Upgrade/Terlalu Mudah Button */}
                      {hasNextLevel && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isUpgraded) return;
                            setActiveUpgradeInfo({
                              oldName: ex.NamaGerakan,
                              nextName: progInfo.next.name,
                              desc: progInfo.next.desc,
                              categoryName: progInfo.categoryName,
                              isDowngrade: false
                            });
                          }}
                          className={`text-[10px] px-2 py-1.5 rounded-lg border font-bold flex items-center space-x-1.5 transition cursor-pointer select-none ${
                            isUpgraded
                              ? 'bg-lime-950/20 border-lime-800/30 text-lime-400 cursor-default'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-lime-400 hover:border-lime-900/50'
                          }`}
                          title={isUpgraded ? `Telah dinaikkan kesulitan ke ${isUpgraded}` : "Gerakan terasa terlalu mudah? Klik untuk naik level kesulitan"}
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          <span>{isUpgraded ? 'Up Leveled' : 'Terlalu Mudah?'}</span>
                        </button>
                      )}

                      {/* Downgrade/Terlalu Sulit Button */}
                      {progInfo && progInfo.index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isUpgraded) return;
                            setActiveUpgradeInfo({
                              oldName: ex.NamaGerakan,
                              nextName: progInfo.levels[progInfo.index - 1].name,
                              desc: progInfo.levels[progInfo.index - 1].desc,
                              categoryName: progInfo.categoryName,
                              isDowngrade: true
                            });
                          }}
                          className="text-[10px] px-2 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:border-rose-900/50 font-bold flex items-center space-x-1.5 transition cursor-pointer select-none"
                          title="Gerakan terasa terlalu sulit? Klik untuk menurunkan level kesulitan"
                        >
                          <ArrowDownCircle className="w-3.5 h-3.5" />
                          <span>Terlalu Sulit?</span>
                        </button>
                      )}

                      {/* Input Performance */}
                      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          value={performanceData[idx] || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setPerformanceData(prev => ({ ...prev, [idx]: val }));
                          }}
                          className="w-10 bg-transparent text-center text-xs font-bold text-zinc-100 focus:outline-none"
                        />
                        <span className="text-[10px] text-zinc-500 font-medium ml-1">
                          {isDuration ? 'dtk' : 'rep'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel AI Insights & Rekomendasi Progresi */}
          <div className="bg-zinc-950/50 border border-zinc-850 rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-center space-x-2 text-lime-400 border-b border-zinc-900 pb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">AI Insights & Rekomendasi</span>
            </div>
            
            <div className="space-y-3.5 text-[11px] leading-relaxed font-sans text-zinc-400">
              {/* Konsistensi */}
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-cyan-950/40 text-cyan-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5 font-mono">
                  {sessionCount}
                </div>
                <div>
                  <p className="text-zinc-200 font-semibold leading-none">Konsistensi Hari {day}: {sessionCount} Sesi</p>
                  <p className="text-zinc-400 mt-1">
                    {sessionCount >= 6 
                      ? "Anda telah menyelesaikan 6+ sesi di hari ini. Tubuh Anda dipastikan sudah teradaptasi dengan baik. Sangat disarankan menaikkan tingkat kesulitan gerakan (progresi) jika target reps saat ini terasa ringan!"
                      : `Selesaikan ${6 - sessionCount} sesi lagi di hari ${day} untuk mencapai fase adaptasi kekuatan & tendon sebelum disarankan menaikkan level kesulitan.`}
                  </p>
                </div>
              </div>

              {/* BB Ektomorf */}
              <div className="flex items-start space-x-2 border-t border-zinc-900 pt-3">
                <Weight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-zinc-200 font-semibold leading-none">
                    Analisis BB Ektomorf: {weight} kg {weightDiff > 0 ? `(+${weightDiff} kg)` : weightDiff < 0 ? `(${weightDiff} kg)` : '(Stabil)'}
                  </p>
                  <p className="text-zinc-400 mt-1">
                    {weightDiff > 0 
                      ? `Selamat! Berat badan Anda meningkat +${weightDiff} kg dari awal latihan (${initialWeight} kg). Untuk tipe tubuh ektomorf, ini pertanda baik kenaikan massa otot. Ingat, beban calisthenics (bodyweight) Anda kini bertambah secara alami. Jika gerakan terasa berat, itu normal; tetapi jika Anda tetap kuat mencapai target reps, kekuatan murni Anda bertambah pesat!`
                      : "Berat badan Anda saat ini stabil. Bagi ektomorf yang ingin meningkatkan massa otot (bulking), sangat penting memicu progressive overload (naik level gerakan / tambah reps) dipadukan dengan surplus kalori yang terpantau di tab Gizi AI."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RPG BOSS BATTLE RESULTS */}
          {(() => {
            const boss = BOSSES[selectedBossIdx];
            const isVictory = bossHp === 0;
            const xpGained = isVictory ? boss.xpReward : Math.round(boss.xpReward * 0.4);
            const coinsGained = isVictory ? boss.coinsReward : Math.round(boss.coinsReward * 0.4);
            const badgeGained = isVictory ? boss.badge : null;

            return (
              <div className="bg-zinc-950/50 border border-zinc-850 rounded-2xl p-5 text-left space-y-4 relative overflow-hidden">
                {isVictory ? (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-lime-500/5 rounded-full blur-2xl"></div>
                ) : (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
                )}

                <div className="flex items-center space-x-2.5">
                  <span className="text-3xl">{isVictory ? '🏆' : '💨'}</span>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Hasil Pertarungan RPG</span>
                    <h3 className={`text-sm font-black uppercase tracking-wide leading-none mt-1 ${isVictory ? 'text-lime-400' : 'text-zinc-400'}`}>
                      {isVictory ? `${boss.name} SLAIN!` : `${boss.name} MELARIKAN DIRI`}
                    </h3>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  {isVictory 
                    ? `Luar biasa! Anda berhasil memberikan total ${damageDealtTotal} damage dan mengalahkan ${boss.name}. Klaim hadiah pertempuran Anda sekarang!`
                    : `Anda telah memberikan total ${damageDealtTotal} damage. Namun ${boss.name} berhasil melarikan diri dengan ${bossHp} HP tersisa. Ambil hadiah hiburan atas perjuangan Anda!`}
                </p>

                {/* Rewards List */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <div className="bg-zinc-900/80 border border-zinc-850 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 font-mono text-xs font-bold text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>+{xpGained} XP</span>
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-850 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 font-mono text-xs font-bold text-amber-400">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>+{coinsGained} Koin</span>
                  </div>
                  {isVictory && badgeGained && (
                    <div className="bg-zinc-900/80 border border-zinc-850 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 font-mono text-xs font-bold text-lime-400">
                      <Shield className="w-3.5 h-3.5 text-lime-400" />
                      <span>Lencana: {badgeGained}</span>
                    </div>
                  )}
                </div>

                {/* Claim Button */}
                {!rewardsClaimed ? (
                  <button
                    type="button"
                    onClick={() => {
                      onRewardRPG(xpGained, coinsGained, badgeGained);
                      setRewardsClaimed(true);
                      playBeep(880, 0.4);
                    }}
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer text-center flex items-center justify-center space-x-2 ${
                      isVictory 
                        ? 'bg-gradient-to-r from-amber-500 to-lime-500 hover:from-amber-400 hover:to-lime-400 text-zinc-950' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    }`}
                  >
                    <span>{isVictory ? 'Klaim Hadiah Kemenangan 🎁' : 'Ambil Hadiah Hiburan 🎁'}</span>
                  </button>
                ) : (
                  <div className="bg-lime-950/20 border border-lime-900/30 text-lime-400 font-extrabold text-xs py-2.5 rounded-xl text-center flex items-center justify-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-lime-400" />
                    <span>Hadiah RPG Berhasil Diklaim! 🏆</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Form Catatan */}
          <div className="space-y-2 text-left pt-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Catatan Sesi (Opsional)
            </label>
            <textarea
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition h-20 resize-none"
              placeholder="Contoh: Sangat lancar, negative pull-up terasa lebih ringan, berhasil menambah durasi plank..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleSaveWorkout}
            disabled={loading}
            className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-950 font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-lime-500/10 active:scale-[0.99]"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            <span>Simpan Progress Latihan</span>
          </button>
        </div>

        {/* Modal Overlay Upgrade / Downgrade Level */}
        {activeUpgradeInfo && (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-left relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${activeUpgradeInfo.isDowngrade ? 'bg-rose-500' : 'bg-lime-500'}`}></div>
              
              <div className="flex items-center space-x-2 pb-2 border-b border-zinc-800">
                {activeUpgradeInfo.isDowngrade ? (
                  <ArrowDownCircle className="w-5 h-5 text-rose-400 animate-pulse" />
                ) : (
                  <ArrowUpCircle className="w-5 h-5 text-lime-400 animate-pulse" />
                )}
                <h3 className="font-bold text-sm text-zinc-100">
                  {activeUpgradeInfo.isDowngrade ? 'Turunkan Level Kesulitan' : 'Upgrade Level Kesulitan'}
                </h3>
              </div>
              
              <div className="space-y-3 text-xs leading-relaxed font-sans text-zinc-350">
                <p>
                  {activeUpgradeInfo.isDowngrade 
                    ? 'Apakah Anda ingin menurunkan tingkat kesulitan gerakan ini karena terasa terlalu berat?' 
                    : 'Apakah Anda ingin menaikkan tingkat kesulitan gerakan ini?'}
                </p>
                <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{activeUpgradeInfo.categoryName}</span>
                    <span className={`text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      activeUpgradeInfo.isDowngrade 
                        ? 'bg-rose-950/30 text-rose-400 border-rose-800/30' 
                        : 'bg-lime-950/30 text-lime-400 border-lime-800/30'
                    }`}>
                      {activeUpgradeInfo.isDowngrade ? 'Down Level' : 'Level Up'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-zinc-100">{activeUpgradeInfo.nextName}</h4>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">{activeUpgradeInfo.desc}</p>
                </div>
                <p className="text-zinc-500 text-[10px] leading-relaxed">
                  Menyetujui akan mengubah gerakan <span className="text-zinc-300 font-semibold">{activeUpgradeInfo.oldName}</span> di jadwal latihan hari <span className="text-zinc-300 font-semibold">{day}</span> secara permanen.
                </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const success = onReplaceJadwalExercise(activeUpgradeInfo.oldName, activeUpgradeInfo.nextName);
                    if (success) {
                      setUpgradedExercises(prev => ({ ...prev, [activeUpgradeInfo.oldName]: activeUpgradeInfo.nextName }));
                    }
                    setActiveUpgradeInfo(null);
                  }}
                  className={`flex-1 font-extrabold py-2.5 rounded-xl transition text-xs cursor-pointer text-center ${
                    activeUpgradeInfo.isDowngrade
                      ? 'bg-rose-600 hover:bg-rose-500 text-zinc-950 shadow-lg shadow-rose-500/10'
                      : 'bg-lime-500 hover:bg-lime-400 text-zinc-950 shadow-lg shadow-lime-500/10'
                  }`}
                >
                  {activeUpgradeInfo.isDowngrade ? 'Turunkan Level' : 'Upgrade Sekarang'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveUpgradeInfo(null)}
                  className="px-4 bg-zinc-850 hover:bg-zinc-800 text-zinc-350 py-2.5 rounded-xl transition text-xs font-semibold cursor-pointer border border-zinc-800"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Persentase progres latihan hari ini
  const progressPercent = Math.round(
    ((currentExerciseIdx) / totalExercises) * 100
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-2 space-y-6">
      {/* Header Workout */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancelWorkout}
          className="flex items-center space-x-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Keluar Sesi</span>
        </button>

        {/* Sound Toggles */}
        <div className="flex items-center space-x-2">
          {/* Voice Toggle */}
          <button
            onClick={() => {
              setIsVoiceEnabled(!isVoiceEnabled);
              if (!isVoiceEnabled) {
                try {
                  window.speechSynthesis.cancel();
                  const speakTest = new SpeechSynthesisUtterance("Suara aktif");
                  speakTest.lang = "id-ID";
                  window.speechSynthesis.speak(speakTest);
                } catch (e) {
                  console.warn("Speech synthesis test failed:", e);
                }
              }
            }}
            className={`p-2 border rounded-lg transition cursor-pointer ${
              isVoiceEnabled 
                ? 'bg-lime-950/20 border-lime-800/40 text-lime-400' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
            title={isVoiceEnabled ? "Matikan Asisten Suara" : "Aktifkan Asisten Suara"}
          >
            {isVoiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Beep Sound Toggle */}
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`p-2 border rounded-lg transition cursor-pointer ${
              isSoundEnabled 
                ? 'bg-cyan-950/20 border-cyan-800/40 text-cyan-400' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
            title={isSoundEnabled ? "Matikan Beep" : "Aktifkan Beep"}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
          <span>Progres Latihan</span>
          <span>{currentExerciseIdx + 1} / {totalExercises} Gerakan</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-lime-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent || 5}%` }}
          ></div>
        </div>
      </div>

      {/* RPG ACTIVE BOSS BATTLE PANEL */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4.5 shadow-xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{BOSSES[selectedBossIdx].icon}</span>
            <div>
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block">Target Bos</span>
              <h3 className="text-xs font-black text-zinc-150 leading-none mt-0.5 uppercase tracking-wide">
                {BOSSES[selectedBossIdx].name}
              </h3>
            </div>
          </div>
          <span className="text-xs font-bold font-mono text-rose-400">
            {bossHp} / {BOSSES[selectedBossIdx].maxHp} HP
          </span>
        </div>

        {/* HP Bar */}
        <div className="w-full h-2 bg-zinc-950 border border-zinc-850 rounded-full overflow-hidden">
          <div 
            className="h-full bg-rose-600 rounded-full transition-all duration-300 shadow-md shadow-rose-500/20"
            style={{ width: `${(bossHp / BOSSES[selectedBossIdx].maxHp) * 100}%` }}
          ></div>
        </div>

        {/* Battle Log */}
        <div className="bg-zinc-950/40 border border-zinc-850 rounded-lg p-2 font-mono text-[9px] text-zinc-500 space-y-0.5">
          {battleLog.map((log, lIdx) => (
            <p key={lIdx} className={lIdx === 0 ? 'text-lime-400 font-semibold' : ''}>
              {log}
            </p>
          ))}
        </div>

        {/* DEV CHEATS */}
        {isDevMode && (
          <div className="flex space-x-2 pt-1.5 border-t border-zinc-850/30">
            <button
              type="button"
              onClick={() => {
                setBossHp(0);
                playBeep(880, 0.3);
                setBattleLog(prev => ["⚡ CHEAT: Bos berhasil dikalahkan secara instan!", ...prev].slice(0, 5));
              }}
              className="flex-1 bg-red-950/30 border border-red-900/40 text-red-400 text-[8px] font-bold py-1 rounded-lg transition text-center cursor-pointer select-none"
            >
              ☠️ Instakill Boss
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomReps(prev => {
                  const currentVal = prev[repsKey] !== undefined ? prev[repsKey] : parseTargetReps(activeExercise.Reps);
                  const nextVal = currentVal + 1;
                  setBossHp(bossPrev => Math.max(bossPrev - 1, 0));
                  setDamageDealtTotal(damagePrev => damagePrev + 1);
                  playBeep(700, 0.05);
                  
                  const selectedBoss = BOSSES[selectedBossIdx];
                  setBattleLog(logPrev => [
                    `⚡ CHEAT: Rep ke-${nextVal} ${activeExercise.NamaGerakan} mengenai ${selectedBoss.name}!`,
                    ...logPrev
                  ].slice(0, 5));

                  return { ...prev, [repsKey]: nextVal };
                });
              }}
              className="flex-1 bg-lime-950/20 border border-lime-900/30 text-lime-400 text-[8px] font-bold py-1 rounded-lg transition text-center cursor-pointer select-none"
            >
              ⚡ Cheat +1 Rep
            </button>
          </div>
        )}
      </div>

      {/* AI WEBCAM TRACKER SYSTEM */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4.5 shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📷</span>
            <div>
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block">Real-time Tracker</span>
              <h3 className="text-xs font-black text-zinc-150 leading-none mt-0.5 uppercase tracking-wide">
                AI Reps & Pose Detector
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={isCameraActive ? stopCameraTracker : startCameraTracker}
            disabled={cameraLoading}
            className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl border transition cursor-pointer select-none ${
              isCameraActive 
                ? 'bg-red-950/20 border-red-900/40 text-red-400' 
                : 'bg-lime-950/20 border-lime-800/40 text-lime-400 hover:bg-lime-950/30'
            }`}
          >
            {cameraLoading ? (
              <span className="flex items-center space-x-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Memuat AI...</span>
              </span>
            ) : isCameraActive ? (
              'Matikan Kamera'
            ) : (
              'Aktifkan Kamera'
            )}
          </button>
        </div>

        {/* Video feed element & overlay skeleton canvas */}
        {/* Video feed element & overlay skeleton canvas */}
        <div className={`relative w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-850 animate-fadeIn ${isCameraActive ? 'block' : 'hidden'}`}>
          <video
            id="ai-pose-video"
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover hidden"
            playsInline
            muted
          ></video>
          
          <canvas
            ref={canvasRef}
            width="480"
            height="270"
            className="w-full h-full object-cover transform scale-x-[-1]" 
          ></canvas>

          {/* Live Angle Indicator */}
          <div className="absolute bottom-3 right-3 bg-zinc-950/80 border border-zinc-800 backdrop-blur-md px-3 py-1.5 rounded-lg flex flex-col items-center">
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-sans">Sudut Sendi</span>
            <span className="text-xs font-black text-lime-400 font-mono mt-0.5">{jointAngle}°</span>
          </div>
          
          {/* Pose State Indicator */}
          <div className="absolute bottom-3 left-3 bg-zinc-950/80 border border-zinc-800 backdrop-blur-md px-3 py-1.5 rounded-lg flex flex-col items-center">
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-sans">Fase Form</span>
            <span className="text-xs font-black text-cyan-400 font-mono mt-0.5 uppercase font-sans">
              {poseState === 'down' ? '⬇️ Flexion' : '⬆️ Extension'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Workout Focus Card */}
      {!isResting ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Badge & Info */}
          <div className="flex justify-between items-center">
            <span className="bg-lime-950/30 text-lime-400 border border-lime-800/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {activeExercise.Kategori || 'Calisthenics'}
            </span>
            <span className="text-xs font-bold text-zinc-500">
              Set {currentSet} dari {activeExercise.Set}
            </span>
          </div>

          {/* Exercise Info */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-zinc-100">{activeExercise.NamaGerakan}</h2>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-sm">
              <Dumbbell className="w-4 h-4" />
              <span>Target: {activeExercise.Reps}</span>
            </div>
          </div>

          {/* Form Guide/Description */}
          <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Deskripsi Singkat:</span>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              {activeExercise.Deskripsi}
            </p>

            {/* Accordion Detail Langkah */}
            {activeExercise.Langkah && activeExercise.Langkah.length > 0 && (
              <div className="border-t border-zinc-800/60 pt-2.5 mt-2.5">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center justify-between w-full text-left text-xs font-bold text-cyan-400 hover:text-cyan-300 transition focus:outline-none cursor-pointer"
                >
                  <span>Lihat Langkah Detail Gerakan</span>
                  <span className="text-[10px]">{showDetails ? '▲ Tutup' : '▼ Pelajari Form'}</span>
                </button>
                
                {showDetails && (
                  <ol className="list-decimal pl-4 pt-2.5 space-y-1.5 text-xs text-zinc-400 leading-relaxed">
                    {activeExercise.Langkah.map((step, sIdx) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>

          {/* Metronome & Tempo Training Panel */}
          <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Metronom Tempo Training:</span>
              <button
                onClick={() => setIsMetronomeEnabled(!isMetronomeEnabled)}
                className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-pointer transition select-none ${
                  isMetronomeEnabled 
                    ? 'bg-amber-950/30 border-amber-800/40 text-amber-400' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400'
                }`}
              >
                {isMetronomeEnabled ? 'Metronom ON' : 'Metronom OFF'}
              </button>
            </div>

            {isMetronomeEnabled && (
              <div className="space-y-3 animate-fadeIn">
                {/* Visualizer Fase Tempo */}
                <div className="bg-zinc-900/60 border border-zinc-850 rounded-lg p-2.5 text-center">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wide block">Fase Gerakan Saat Ini:</span>
                  <span className="text-sm font-extrabold text-amber-400 mt-1 block font-sans">
                    {(() => {
                      const sec = metronomeSeconds;
                      if (sec < tempoEccentric) {
                        return `⬇️ Turun (Fase Eksentrik) - ${tempoEccentric - sec}s`;
                      } else if (sec < tempoEccentric + tempoIsometricBottom) {
                        return `🛑 Tahan Bawah (Iso Bottom) - ${tempoEccentric + tempoIsometricBottom - sec}s`;
                      } else if (sec < tempoEccentric + tempoIsometricBottom + tempoConcentric) {
                        return `⬆️ Naik (Fase Konsentrik) - ${tempoEccentric + tempoIsometricBottom + tempoConcentric - sec}s`;
                      } else {
                        return `🛑 Tahan Atas (Iso Top) - ${tempoEccentric + tempoIsometricBottom + tempoConcentric + tempoIsometricTop - sec}s`;
                      }
                    })()}
                  </span>
                  
                  {/* Tanda ketukan (bip visual) */}
                  <div className="flex justify-center space-x-1.5 mt-2.5">
                    {Array.from({ length: tempoEccentric + tempoIsometricBottom + tempoConcentric + tempoIsometricTop }).map((_, idx) => (
                      <span 
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                          metronomeSeconds === idx 
                            ? 'bg-amber-400 scale-125 shadow-md shadow-amber-400/50' 
                            : 'bg-zinc-800'
                        }`}
                      ></span>
                    ))}
                  </div>
                </div>

                {/* Pengaturan Tempo (Slider Mini) */}
                <div className="grid grid-cols-4 gap-2 text-[10px] border-t border-zinc-900 pt-3">
                  <div>
                    <span className="text-zinc-500 block text-[8px] uppercase font-bold mb-1">Eksentrik</span>
                    <select
                      value={tempoEccentric}
                      onChange={(e) => {
                        setTempoEccentric(Number(e.target.value));
                        setMetronomeSeconds(0);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-zinc-350 font-mono focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}s</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[8px] uppercase font-bold mb-1">Iso Bawah</span>
                    <select
                      value={tempoIsometricBottom}
                      onChange={(e) => {
                        setTempoIsometricBottom(Number(e.target.value));
                        setMetronomeSeconds(0);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-zinc-350 font-mono focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {[0, 1, 2, 3].map(v => <option key={v} value={v}>{v}s</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[8px] uppercase font-bold mb-1">Konsentrik</span>
                    <select
                      value={tempoConcentric}
                      onChange={(e) => {
                        setTempoConcentric(Number(e.target.value));
                        setMetronomeSeconds(0);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-zinc-350 font-mono focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {[1, 2, 3].map(v => <option key={v} value={v}>{v}s</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[8px] uppercase font-bold mb-1">Iso Atas</span>
                    <select
                      value={tempoIsometricTop}
                      onChange={(e) => {
                        setTempoIsometricTop(Number(e.target.value));
                        setMetronomeSeconds(0);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-zinc-350 font-mono focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {[0, 1, 2, 3].map(v => <option key={v} value={v}>{v}s</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-[9px] text-zinc-500 leading-relaxed font-sans text-center">
                  Tempo standar: <span className="font-mono text-zinc-400">3s Turun - 1s Tahan - 1s Naik</span>. Bunyi bip akan melatih ritme gerakan yang konstan.
                </p>
              </div>
            )}
          </div>

          {/* Action Button & Reps Input */}
          <div className="flex items-center space-x-3">
            {/* Input Reps Aktual Set Ini */}
            <div className="flex flex-col space-y-1 shrink-0">
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider text-center">Reps Set Ini</span>
              <div className="flex items-center bg-zinc-950 border border-zinc-850 rounded-xl px-2.5 py-2 w-20">
                <input
                  type="number"
                  min="0"
                  value={currentRepsValue}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setCustomReps(prev => ({ ...prev, [repsKey]: val }));
                  }}
                  className="w-full bg-transparent text-center text-xs font-bold text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleFinishSet}
              className="flex-1 bg-lime-500 hover:bg-lime-400 text-zinc-950 font-bold py-4 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm cursor-pointer shadow-lg shadow-lime-500/5 hover:shadow-lime-500/10 active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Selesaikan Set {currentSet}</span>
            </button>
          </div>
        </div>
      ) : (
        /* REST TIMER MODAL IN-PLACE */
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 transition-all duration-1000" style={{ width: `${(restTimeLeft / (parseInt(activeExercise.Istirahat) || 60)) * 100}%` }}></div>
          
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">
              Waktu Istirahat
            </span>
            <p className="text-xs text-zinc-400">Rilekskan otot Anda sebelum set berikutnya</p>
          </div>

          {/* Timer Display */}
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            {/* Background Circle */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-zinc-800 fill-none"
                strokeWidth="6"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-cyan-400 fill-none transition-all duration-1000"
                strokeWidth="6"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * restTimeLeft) / (parseInt(activeExercise.Istirahat) || 60)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-3xl font-bold font-mono text-zinc-100">
              {restTimeLeft}s
            </div>
          </div>

          {/* Next Exercise Info */}
          <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-3 text-left">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Selanjutnya:</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs font-semibold text-zinc-300">
                {currentSet < activeExercise.Set 
                  ? `${activeExercise.NamaGerakan} (Set ${currentSet + 1})`
                  : currentExerciseIdx < totalExercises - 1
                    ? workoutList[currentExerciseIdx + 1].NamaGerakan
                    : 'Workout Selesai!'}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {currentSet < activeExercise.Set 
                  ? activeExercise.Reps 
                  : currentExerciseIdx < totalExercises - 1
                    ? workoutList[currentExerciseIdx + 1].Reps
                    : ''}
              </span>
            </div>
          </div>

          {/* Skip Button */}
          <button
            onClick={skipRest}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-3 rounded-xl transition text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Lewati Istirahat</span>
          </button>
        </div>
      )}

      {/* Exercise Queue Preview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Daftar Gerakan Hari Ini
        </h3>
        <div className="space-y-2">
          {workoutList.map((ex, idx) => {
            const isCompleted = idx < currentExerciseIdx;
            const isActive = idx === currentExerciseIdx;
            return (
              <div 
                key={idx}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs transition ${
                  isActive 
                    ? 'bg-lime-950/15 border-lime-500/40 text-lime-300 font-semibold' 
                    : isCompleted
                      ? 'bg-zinc-950/40 border-zinc-850/60 text-zinc-500 line-through'
                      : 'bg-zinc-950/20 border-zinc-850/30 text-zinc-400'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] ${
                    isActive
                      ? 'bg-lime-500 text-zinc-950 font-bold'
                      : isCompleted
                        ? 'bg-zinc-800 text-zinc-600'
                        : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}>
                    {idx + 1}
                  </span>
                  <span>{ex.NamaGerakan}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono opacity-80">{ex.Set} Set x {ex.Reps}</span>
                  {isCompleted && <CheckCircle2 className="w-4 h-4 text-zinc-600 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
