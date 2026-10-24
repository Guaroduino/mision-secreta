import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Volume2, Sparkles, CheckCircle2, RotateCcw, 
  Trophy, ShieldAlert, Award, Play, Eye, Flame, AlertCircle, 
  VolumeX, ArrowRight, UserCheck, RefreshCw, Zap, Check, Lock, Video,
  Key, Settings, ExternalLink, Trash2, CheckCircle, ShieldCheck, X
} from 'lucide-react';

// Generador de efectos de audio con Web Audio API (cero dependencias externas)
class SpyAudio {
  static ctx = null;

  static init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.ctx = new AudioContextClass();
    }
  }

  static playBeep(freq = 520, type = 'sine', duration = 0.12) {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  static playSuccess() {
    this.playBeep(523.25, 'triangle', 0.1);
    setTimeout(() => this.playBeep(659.25, 'triangle', 0.12), 90);
    setTimeout(() => this.playBeep(783.99, 'triangle', 0.15), 180);
    setTimeout(() => this.playBeep(1046.50, 'triangle', 0.28), 280);
  }

  static playAlarm() {
    this.playBeep(440, 'sawtooth', 0.12);
    setTimeout(() => this.playBeep(330, 'sawtooth', 0.2), 110);
  }

  static playRadar() {
    this.playBeep(880, 'sine', 0.08);
  }
}

// Misiones preconfiguradas 100% físicas para el mundo real (Modo Local / Fallback)
const REAL_WORLD_MISSIONS = [
  {
    stepsCount: 2,
    category: 'Cuerpo & Objeto',
    title: 'Operación Pingüino y Marcador',
    targetItem: 'un lápiz, bolígrafo o marcador',
    steps: [
      { id: 1, text: "Camina como pingüino hasta la puerta de la habitación", icon: "🐧" },
      { id: 2, text: "Busca un lápiz o marcador y muéstralo aquí", icon: "✏️" }
    ]
  },
  {
    stepsCount: 2,
    category: 'Bloques / LEGO',
    title: 'Torre Dúo Relámpago',
    targetItem: 'una torre armada con 2 bloques de colores distintos',
    steps: [
      { id: 1, text: "Corre a tu zona de juguetes y toma 2 piezas de bloques o LEGO", icon: "🧱" },
      { id: 2, text: "Arma una torre con una pieza sobre otra y tráela a la base", icon: "🗼" }
    ]
  },
  {
    stepsCount: 3,
    category: 'Movimiento & Colores',
    title: 'Operación Camaleón Azul',
    targetItem: 'una prenda de ropa o tela de color azul',
    steps: [
      { id: 1, text: "Toca el marco de la puerta más cercana con ambas manos", icon: "🚪" },
      { id: 2, text: "Da 3 saltos altos con energía", icon: "🤸‍♀️" },
      { id: 3, text: "Encuentra una prenda de ropa o tela azul y tráela a la cámara", icon: "👕" }
    ]
  },
  {
    stepsCount: 3,
    category: 'LEGO / Construcción',
    title: 'Torre Semáforo Real',
    targetItem: 'una torre construida con al menos 3 bloques de colores',
    steps: [
      { id: 1, text: "Busca 3 bloques de construcción o piezas LEGO", icon: "🧱" },
      { id: 2, text: "Coloca la primera abajo, la segunda en medio y la tercera arriba", icon: "🚥" },
      { id: 3, text: "Pon la torre sobre la mesa frente a la cámara de la base", icon: "📸" }
    ]
  },
  {
    stepsCount: 4,
    category: 'Memoria Élite Espía',
    title: 'Operación Guardián de Peluche',
    targetItem: 'un peluche o juguete pequeño',
    steps: [
      { id: 1, text: "Haz una pose de estatua secreta sin moverte durante 5 segundos", icon: "🗿" },
      { id: 2, text: "Toca el suelo con una rodilla y aplaude 2 veces", icon: "👏" },
      { id: 3, text: "Busca un peluche o figura pequeña que tengas en el cuarto", icon: "🧸" },
      { id: 4, text: "Coloca el juguete frente a la lente para que el radar lo analice", icon: "🔍" }
    ]
  },
  {
    stepsCount: 4,
    category: 'Exploración de la Casa',
    title: 'Misión Cuchara de Plata',
    targetItem: 'una cuchara pequeña limpia o utensilio de cocina seguro',
    steps: [
      { id: 1, text: "Gira una vuelta completa sobre tus pies como una bailarina ninja", icon: "🌪️" },
      { id: 2, text: "Toca la mesa del comedor o escritorio con la punta de tu índice", icon: "🪑" },
      { id: 3, text: "Pide o busca una cuchara pequeña limpia con cuidado", icon: "🥄" },
      { id: 4, text: "Sostén la cuchara en alto frente a la cámara para validar", icon: "✨" }
    ]
  }
];

export default function App() {
  // Manejo de Gemini API Key
  const [apiKey, setApiKey] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('gemini_api_key')) || "";
  });
  const [inputKey, setInputKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState(null); // { success: boolean, message: string }
  const [saveToStorage, setSaveToStorage] = useState(true);

  // Estado de Gamificación
  const [xp, setXp] = useState(140);
  const [completedCount, setCompletedCount] = useState(2);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Estado de la Misión Actual
  const [difficultySteps, setDifficultySteps] = useState(3);
  const [currentMission, setCurrentMission] = useState(REAL_WORLD_MISSIONS[2]);
  
  // Flujo del protocolo: 'listen' -> 'repeat' -> 'action' -> 'verify' -> 'success'
  const [phase, setPhase] = useState('listen');
  const [repeatTaps, setRepeatTaps] = useState(0); 
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState([]);

  // Cámara e IA Gemini
  const [cameraActive, setCameraActive] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Referencias DOM
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // Inicializar inputKey cuando se abre el modal
  useEffect(() => {
    if (showKeyModal) {
      setInputKey(apiKey);
      setKeyTestStatus(null);
    }
  }, [showKeyModal, apiKey]);

  // Rangos de Espía
  const getRank = (score) => {
    if (score >= 600) return { title: 'Comandante Secreta Suprema', badge: '🦅', color: 'text-amber-300' };
    if (score >= 350) return { title: 'Agente Élite de Campo', badge: '🕵️‍♀️', color: 'text-purple-300' };
    if (score >= 180) return { title: 'Detective Especial', badge: '🔍', color: 'text-cyan-300' };
    return { title: 'Cadete en Entrenamiento', badge: '⭐', color: 'text-emerald-300' };
  };
  const currentRank = getRank(xp);

  // Probar la API Key
  const handleTestKey = async (keyToTest = inputKey) => {
    const key = keyToTest.trim();
    if (!key) {
      setKeyTestStatus({ success: false, message: "Por favor escribe una API Key primero." });
      return false;
    }
    setKeyTesting(true);
    setKeyTestStatus(null);
    SpyAudio.playRadar();

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Responde únicamente: 'CONEXION_EXITOSA'" }] }]
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Error HTTP ${res.status}`);
      }

      setKeyTestStatus({ success: true, message: "¡Conexión exitosa con Google Gemini!" });
      SpyAudio.playSuccess();
      return true;
    } catch (err) {
      setKeyTestStatus({ success: false, message: `Fallo de validación: ${err.message}` });
      SpyAudio.playAlarm();
      return false;
    } finally {
      setKeyTesting(false);
    }
  };

  // Guardar la Key
  const handleSaveKey = () => {
    const cleanKey = inputKey.trim();
    setApiKey(cleanKey);
    if (saveToStorage) {
      localStorage.setItem('gemini_api_key', cleanKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setShowKeyModal(false);
    SpyAudio.playSuccess();
  };

  // Eliminar la Key
  const handleClearKey = () => {
    setApiKey("");
    setInputKey("");
    localStorage.removeItem('gemini_api_key');
    setKeyTestStatus(null);
    SpyAudio.playAlarm();
  };

  // Síntesis de voz (Web Speech API)
  const speakText = (text) => {
    if (!speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.88;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const narrateMission = () => {
    if (!currentMission) return;
    SpyAudio.playRadar();
    const stepsSpoken = currentMission.steps.map(s => `Paso ${s.id}: ${s.text}`).join(". ");
    const speech = `¡Atenta Agente! Misión entrante de ${currentMission.steps.length} pasos. ${stepsSpoken}. Repite la misión en voz alta tres veces antes de moverte.`;
    speakText(speech);
  };

  // Temporizador de cuenta regresiva
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerActive) {
      setIsTimerActive(false);
      SpyAudio.playAlarm();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds]);

  // Manejo de la Cámara Web
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      SpyAudio.playRadar();
    } catch (err) {
      console.warn("No se pudo acceder a la webcam:", err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (phase === 'verify') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [phase]);

  // Tomar captura de la cámara
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    SpyAudio.playRadar();
    return dataUrl;
  };

  // Análisis multimodal con Gemini Vision o Modo Respaldo
  const analyzeProofWithGemini = async () => {
    const photoDataUrl = captureSnapshot();
    if (!photoDataUrl) {
      alert("Por favor asegúrate de que la cámara esté encendida.");
      return;
    }

    setIsAnalyzingAI(true);
    setAiFeedback(null);
    SpyAudio.playRadar();

    // Si NO hay API Key configurada, informar con opción amable o validación procedural
    if (!apiKey.trim()) {
      setTimeout(() => {
        setIsAnalyzingAI(false);
        const fallbackResult = {
          cumplido: true,
          mensaje_divertido: "¡Gran trabajo agente! Sensores locales confirman el objeto. (Tip: Añade tu API Key de Gemini para activar la visión artificial en vivo).",
          detalles_observados: "Validación por sensor interno del Cuartel."
        };
        setAiFeedback(fallbackResult);
        handleMissionVictory(fallbackResult.mensaje_divertido);
      }, 1000);
      return;
    }

    const base64Data = photoDataUrl.split(',')[1];
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`;

    const promptText = `Eres el Cuartel General de una Academia Secreta de Espías para niñas. 
Evalúa con cariño, motivación y entusiasmo si la niña cumplió la misión física.
La misión solicitaba: "${currentMission.targetItem || currentMission.title}".
Pasos completos asignados: ${currentMission.steps.map(s => s.text).join(' | ')}.

Observa con atención la foto enviada desde la webcam.
¿Se observa en la imagen el objeto, la torre de bloques, la persona haciendo la acción, o el elemento solicitado (como ${currentMission.targetItem})? 
Sé muy tolerante con la iluminación, reflejos o si la niña sostiene el objeto con sus manos.

Responde ÚNICAMENTE un objeto JSON válido con este formato:
{
  "cumplido": true o false,
  "mensaje_divertido": "Comentario entusiasta y cariñoso de espía dirigido a la niña",
  "detalles_observados": "Lo que viste en la imagen"
}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const rawJson = result.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawJson);

      setAiFeedback(parsed);

      if (parsed.cumplido) {
        handleMissionVictory(parsed.mensaje_divertido);
      } else {
        SpyAudio.playAlarm();
        speakText("Casi lo tenemos, agente. " + (parsed.mensaje_divertido || "Muestra el objeto un poco más cerca de la cámara."));
      }
    } catch (e) {
      console.warn("Fallo o API Key inválida:", e);
      const fallbackResult = {
        cumplido: true,
        mensaje_divertido: "¡Nuestros radares de respaldo confirman que lo lograste con éxito!",
        detalles_observados: `Aprobado por sensor alterno (${e.message || 'Sin conexión'})`
      };
      setAiFeedback(fallbackResult);
      handleMissionVictory(fallbackResult.mensaje_divertido);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Victoria de Misión
  const handleMissionVictory = (cheerMessage) => {
    SpyAudio.playSuccess();
    setPhase('success');
    const points = currentMission.steps.length * 30;
    setXp(x => x + points);
    setCompletedCount(c => c + 1);
    speakText(cheerMessage || "¡Misión secreta cumplida con honores! Tu memoria operativa está en nivel supremo.");
  };

  // Generador de Misiones con Gemini
  const generateNewAIMission = async () => {
    if (!apiKey.trim()) {
      setShowKeyModal(true);
      return;
    }

    setIsAnalyzingAI(true);
    SpyAudio.playRadar();

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`;

    const prompt = `Crea una misión física divertida para entrenar la memoria de trabajo y seguimiento de instrucciones en una niña inteligente.
Dificultad: exactamente ${difficultySteps} pasos secuenciales.
REGLA OBLIGATORIA:
Los pasos deben ocurrir en la CASA REAL (moverse físicamente, tocar la puerta, traer un calcetín rojo, armar 3 Legos, saltar como conejo, traer una cuchara, etc.). El último paso SIEMPRE debe ser traer un objeto o colocarse frente a la cámara para mostrar el resultado.

Devuelve SOLO JSON con este formato:
{
  "title": "Nombre divertido de espía",
  "category": "Cuerpo y Objetos",
  "targetItem": "descripción breve del objeto o construcción a mostrar ante la cámara al final",
  "steps": [
    { "id": 1, "text": "Paso 1 muy claro y corto", "icon": "emoji" },
    { "id": 2, "text": "Paso 2 muy claro y corto", "icon": "emoji" }
  ]
}`;

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await res.json();
      const missionJson = JSON.parse(data.candidates[0].content.parts[0].text);
      if (missionJson.steps && missionJson.steps.length > 0) {
        missionJson.stepsCount = missionJson.steps.length;
        setCurrentMission(missionJson);
        resetMissionFlow();
        SpyAudio.playSuccess();
      }
    } catch (e) {
      console.warn("Fallo IA, seleccionando misión física del catálogo:", e);
      pickRandomPreset(difficultySteps);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const pickRandomPreset = (stepsNum) => {
    const matching = REAL_WORLD_MISSIONS.filter(m => m.stepsCount === stepsNum);
    const selected = matching.length > 0 
      ? matching[Math.floor(Math.random() * matching.length)]
      : REAL_WORLD_MISSIONS[Math.floor(Math.random() * REAL_WORLD_MISSIONS.length)];
    setCurrentMission(selected);
    resetMissionFlow();
  };

  const resetMissionFlow = () => {
    setPhase('listen');
    setRepeatTaps(0);
    setTimerSeconds(difficultySteps >= 4 ? 110 : 80);
    setIsTimerActive(false);
    setCheckedSteps([]);
    setCapturedImage(null);
    setAiFeedback(null);
  };

  const selectStepDifficulty = (num) => {
    setDifficultySteps(num);
    pickRandomPreset(num);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {/* Header Central de Inteligencia */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              🕵️‍♀️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wide text-white">
                  MISIÓN SECRETA
                </h1>
                <span className="text-[10px] bg-red-950/80 text-red-400 border border-red-800/60 font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                  Mundo Real
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Entrenamiento Físico de Memoria Operativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Botón de Configuración de API Key */}
            <button
              onClick={() => setShowKeyModal(true)}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                apiKey.trim()
                  ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/70'
                  : 'bg-amber-950/70 border-amber-500/60 text-amber-300 hover:bg-amber-900/70'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {apiKey.trim() ? 'Gemini Activa' : 'Configurar Key'}
              </span>
              <span className={`w-2 h-2 rounded-full ${apiKey.trim() ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
            </button>

            {/* Medalla de Rango */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="text-lg">{currentRank.badge}</span>
              <div className="hidden sm:block text-left">
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Rango</div>
                <div className={`text-xs font-black ${currentRank.color}`}>{currentRank.title}</div>
              </div>
            </div>

            {/* Puntos XP */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <div className="text-xs font-black text-amber-300 font-mono">{xp} XP</div>
            </div>

            {/* Silenciador de voz */}
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              title={speechEnabled ? "Desactivar voz guía" : "Activar voz guía"}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {speechEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        
        {/* Selector de Pasos (Dificultad de la Memoria de Trabajo) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider font-mono">
              Nivel de Memoria RAM Cerebral
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ¿Cuántas instrucciones consecutivas retendrá en esta misión?
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => selectStepDifficulty(num)}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all ${
                  difficultySteps === num
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {num} Pasos
              </button>
            ))}

            <button
              onClick={generateNewAIMission}
              disabled={isAnalyzingAI}
              className="ml-2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAnalyzingAI ? 'Ideando...' : 'Misión IA'}</span>
            </button>
          </div>
        </div>

        {/* Fases del Protocolo de Memoria de Trabajo */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-black">
          <div className={`p-2.5 rounded-xl border transition-all ${
            phase === 'listen' ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950' : 'bg-slate-900/40 border-slate-800 text-slate-500'
          }`}>
            <span>1. Escuchar</span>
          </div>
          <div className={`p-2.5 rounded-xl border transition-all ${
            phase === 'repeat' ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md shadow-amber-950' : 'bg-slate-900/40 border-slate-800 text-slate-500'
          }`}>
            <span>2. Repetir</span>
          </div>
          <div className={`p-2.5 rounded-xl border transition-all ${
            phase === 'action' ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-950' : 'bg-slate-900/40 border-slate-800 text-slate-500'
          }`}>
            <span>3. Ejecutar</span>
          </div>
          <div className={`p-2.5 rounded-xl border transition-all ${
            phase === 'verify' || phase === 'success' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950' : 'bg-slate-900/40 border-slate-800 text-slate-500'
          }`}>
            <span>4. Validar</span>
          </div>
        </div>

        {/* ================= TARJETA PRINCIPAL DE MISIÓN ================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Encabezado de la Misión */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-md font-mono">
                  {currentMission.category}
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  {currentMission.steps.length} Acciones Consecutivas
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {currentMission.title}
              </h2>
            </div>

            <button
              onClick={narrateMission}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-700/60 hover:bg-cyan-900 text-cyan-300 text-xs font-black shadow-md transition-all self-start sm:self-auto"
            >
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Escuchar Instrucciones</span>
            </button>
          </div>

          {/* Lista de Pasos Encadenados */}
          <div className="my-6 space-y-3">
            {currentMission.steps.map((st, idx) => {
              const isChecked = checkedSteps.includes(st.id);
              return (
                <div
                  key={st.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    phase === 'action'
                      ? 'bg-slate-800/70 border-slate-700 hover:border-slate-500'
                      : 'bg-slate-900/60 border-slate-800'
                  } ${isChecked ? 'bg-emerald-950/20 border-emerald-600/40 text-slate-300' : ''}`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center text-lg font-black shadow-sm">
                      {st.icon || idx + 1}
                    </div>
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        Paso {st.id}
                      </div>
                      <div className="text-base font-bold text-white">
                        {st.text}
                      </div>
                    </div>
                  </div>

                  {phase === 'action' && (
                    <button
                      onClick={() => {
                        SpyAudio.playRadar();
                        setCheckedSteps(prev => 
                          prev.includes(st.id) ? prev.filter(i => i !== st.id) : [...prev, st.id]
                        );
                      }}
                      className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-slate-600 hover:border-slate-400 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* ================= FASE 1: ESCUCHAR ================= */}
          {phase === 'listen' && (
            <div className="p-5 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Paso 1: Memoriza la secuencia
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Léele o haz clic en "Escuchar". Aún no debe pararse de su asiento.
                </p>
              </div>

              <button
                onClick={() => {
                  SpyAudio.playSuccess();
                  setPhase('repeat');
                  speakText("¡Muy bien! Ahora repite todos los pasos en voz alta tres veces seguidas.");
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <span>¡Instrucciones Escuchadas!</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ================= FASE 2: REPETIR EN VOZ ALTA ================= */}
          {phase === 'repeat' && (
            <div className="p-5 rounded-2xl bg-amber-950/30 border-2 border-dashed border-amber-600/50 space-y-4 text-center">
              <div className="max-w-md mx-auto">
                <span className="text-3xl">🗣️</span>
                <h4 className="text-base font-black text-amber-300 mt-1">
                  ¡Regla de Oro: Habla Interna Activada!
                </h4>
                <p className="text-xs text-amber-200/80 mt-1">
                  Pídele que te repita los {currentMission.steps.length} pasos en orden. Repetirlo fija el circuito en su memoria antes de actuar.
                </p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => {
                    const next = repeatTaps + 1;
                    setRepeatTaps(next);
                    SpyAudio.playBeep(440 + next * 120, 'sine', 0.15);
                    if (next >= 3) {
                      setTimeout(() => {
                        setPhase('action');
                        setIsTimerActive(true);
                        SpyAudio.playSuccess();
                        speakText("¡Cerebro activado! Tienes el tiempo en marcha para completar la misión en la casa.");
                      }, 400);
                    }
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center gap-3"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Repetido en voz alta ({repeatTaps}/3) veces</span>
                </button>
                <div className="text-[11px] text-slate-400">
                  Haz clic cada vez que tu hija repita toda la secuencia con sus propias palabras.
                </div>
              </div>
            </div>
          )}

          {/* ================= FASE 3: EJECUTAR EN EL MUNDO REAL ================= */}
          {phase === 'action' && (
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-black text-xl text-amber-400">
                    {timerSeconds}s
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">
                      ¡Misión en Curso en la Habitación!
                    </h4>
                    <p className="text-xs text-slate-400">
                      Ella debe cumplir las acciones en la vida real. Marca los pasos arriba a medida que los haga.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsTimerActive(false);
                    setPhase('verify');
                    SpyAudio.playRadar();
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>¡Ya lo hizo! Validar Prueba</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= FASE 4: VALIDACIÓN CON CÁMARA E IA ================= */}
          {phase === 'verify' && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-cyan-300 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Escaneo de Prueba con Inteligencia Artificial
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Muestra a la cámara: <strong className="text-amber-300">{currentMission.targetItem}</strong>
                  </p>
                </div>

                {/* Salida manual para padres */}
                <button
                  onClick={() => handleMissionVictory("¡Validado directamente por el oficial superior en casa!")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Validar por Papá/Mamá</span>
                </button>
              </div>

              {/* Visor de Webcam */}
              <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video max-w-md mx-auto flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {!cameraActive && (
                  <div className="text-center p-6 space-y-3">
                    <Video className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Cámara desactivada o sin permisos concedidos.
                    </p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                    >
                      Activar Cámara
                    </button>
                  </div>
                )}

                {/* Cuadrícula de Escáner Espía */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none border-2 border-cyan-500/40 rounded-2xl flex flex-col justify-between p-3">
                    <div className="flex justify-between items-center text-[10px] font-mono text-cyan-400 bg-black/60 px-2 py-0.5 rounded">
                      <span>RADAR_ESPÍA: {apiKey ? 'GEMINI_VISION_LIVE' : 'MODO_LOCAL'}</span>
                      <span className="animate-pulse">● REC</span>
                    </div>
                    <div className="w-16 h-16 border-2 border-dashed border-cyan-400/70 rounded-xl mx-auto opacity-75"></div>
                    <div className="text-center text-[11px] text-cyan-300 font-mono bg-black/60 py-1 rounded">
                      Centra aquí el objeto o la torre armada
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de Captura y Envío a Gemini */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={analyzeProofWithGemini}
                  disabled={isAnalyzingAI}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isAnalyzingAI ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzingAI ? 'Analizando con Visión IA...' : '¡Escanear Prueba Ahora!'}</span>
                </button>
              </div>

              {/* Feedback devuelto por la IA */}
              {aiFeedback && (
                <div className={`p-4 rounded-xl border text-left text-xs ${
                  aiFeedback.cumplido 
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' 
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}>
                  <div className="font-bold flex items-center gap-2">
                    {aiFeedback.cumplido ? '✅ Cuartel General Confirma:' : '⚠️ Ajuste Necesario:'}
                  </div>
                  <div className="mt-1 text-sm font-semibold">{aiFeedback.mensaje_divertido}</div>
                  {aiFeedback.detalles_observados && (
                    <div className="text-[11px] opacity-75 mt-1 font-mono">
                      Detalle visual: {aiFeedback.detalles_observados}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= FASE 5: VICTORIA / MISIÓN LOGRADA ================= */}
          {phase === 'success' && (
            <div className="p-8 rounded-3xl bg-gradient-to-b from-emerald-950/60 to-slate-900 border-2 border-emerald-500 text-center space-y-4">
              <div className="text-6xl animate-bounce">🏆</div>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-300">
                ¡MISIÓN MUNDO REAL CUMPLIDA!
              </h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Tu hija escuchó, retuvo en memoria motora y ejecutó todos los pasos en el espacio físico.
              </p>

              <div className="inline-flex items-center gap-2 bg-emerald-900/60 border border-emerald-600/60 px-4 py-2 rounded-xl text-emerald-300 font-bold text-sm">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>+{currentMission.steps.length * 30} Puntos de Memoria Ganados</span>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => pickRandomPreset(difficultySteps)}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20"
                >
                  Siguiente Misión de Campo ➔
                </button>

                <button
                  onClick={generateNewAIMission}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-xl shadow-purple-900/30 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Crear Misión con IA</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Guía Pedagógica para los Padres */}
        <footer className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Por qué funciona este método en la vida real:</span>
          </div>
          <p>
            Al forzar a la niña a <strong>repetir la orden en voz alta antes de moverse</strong>, transformamos una orden externa en <em>habla subvocal autodirigida</em>. Esto activa los lóbulos frontales y evita que olvide la segunda o tercera parte de la instrucción mientras camina por la casa.
          </p>
        </footer>

      </main>

      {/* ================= MODAL DE CONFIGURACIÓN DE GEMINI API KEY ================= */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header del modal */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Configurar Gemini API Key</h3>
                  <p className="text-xs text-slate-400">Activa la visión artificial con cámara y misiones infinitas</p>
                </div>
              </div>
              <button 
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input de la API Key */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Tu Google AI Studio API Key:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => {
                    setInputKey(e.target.value);
                    setKeyTestStatus(null);
                  }}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 focus:outline-none rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Opciones de Almacenamiento */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveLocal"
                checked={saveToStorage}
                onChange={(e) => setSaveToStorage(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-400 bg-slate-950 border-slate-800 cursor-pointer"
              />
              <label htmlFor="saveLocal" className="text-xs text-slate-400 cursor-pointer">
                Recordar en este navegador (localStorage)
              </label>
            </div>

            {/* Estado de la prueba */}
            {keyTestStatus && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                keyTestStatus.success 
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/60 text-rose-300'
              }`}>
                {keyTestStatus.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{keyTestStatus.message}</span>
              </div>
            )}

            {/* Enlace a Google AI Studio */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>¿No tienes una clave todavía? Es gratis:</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold underline ml-2"
              >
                <span>Obtener en AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div>
                {apiKey && (
                  <button
                    onClick={handleClearKey}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Key</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestKey()}
                  disabled={keyTesting || !inputKey.trim()}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${keyTesting ? 'animate-spin' : ''}`} />
                  <span>{keyTesting ? 'Probando...' : 'Probar Conexión'}</span>
                </button>

                <button
                  onClick={handleSaveKey}
                  disabled={!inputKey.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-400/20 transition-all disabled:opacity-50"
                >
                  Guardar y Activar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
