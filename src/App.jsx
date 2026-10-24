import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Volume2, Sparkles, CheckCircle2, RotateCcw, 
  Trophy, ShieldAlert, Award, Play, Eye, Flame, AlertCircle, 
  VolumeX, ArrowRight, UserCheck, RefreshCw, Zap, Check, Lock, Video,
  Key, Settings, ExternalLink, Trash2, CheckCircle, ShieldCheck, X,
  Plus, Wand2, Sliders, Mic, MicOff
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

// Temáticas rápidas para que la IA genere instrucciones variadas
const AI_THEMES = [
  { id: 'sorpresa', label: '🎲 Sorpresa Espía', prompt: 'Combina movimientos divertidos y variados con buscar objetos cotidianos seguros de la casa.' },
  { id: 'lego', label: '🧱 LEGO y Bloques', prompt: 'Usa piezas de LEGO, bloques de construcción o torres de colores combinadas con desafíos de movimiento físico.' },
  { id: 'ninja', label: '🥷 Agente Ninja', prompt: 'Incluye poses de equilibrio, saltos ninja, caminar sin hacer ruido, tocar paredes o puertas y traer un objeto secreto.' },
  { id: 'colores', label: '🎨 Cazadora de Colores', prompt: 'Sigue una secuencia buscando o tocando objetos de colores específicos en la habitación y trayendo el último a la cámara.' },
  { id: 'peluches', label: '🧸 Peluches y Juguetes', prompt: 'Misión de rescate de juguetes, muñecos o peluches con pasos físicos intermedios divertidos.' },
  { id: 'dibujo', label: '✏️ Papel y Lápiz', prompt: 'Incluye buscar útiles escolares (lápiz, marcador, cuaderno o libro) o dibujar una figura rápida para mostrar a la cámara.' }
];

// Semillas creativas para garantizar que la IA SIEMPRE invente misiones completamente distintas
const CREATIVE_SCENARIOS = [
  "Operación de sigilo en gravedad cero como astronauta",
  "Entrenamiento de agilidad felina y rescate de artefacto doméstico",
  "Código secreto de bailarina ninja y búsqueda del tesoro por colores",
  "Misión submarina imaginaria esquivando láseres invisibles en el cuarto",
  "Desafío de equilibrio real y recolección de suministros de expedición",
  "Rastreo de detective con pistas táctiles en muebles seguros de la habitación",
  "Operación relámpago de coordinación motora y objetos suaves",
  "Misión de camuflaje ártico con pasos de animales divertidos",
  "Protocolo de supervelocidad controlada y construcción o emparejamiento de objetos",
  "Aventura en la jungla secreta saltando charcos imaginarios y rescatando un objeto",
  "Sincronización cerebral de espía maestro con toques rítmicos y palmas",
  "Infiltración silenciosa en cámara lenta y hallazgo de objeto brillante o colorido"
];

// Generador de acciones físicas dinámicas escaladas según la cantidad de repeticiones/intensidad por paso
function getScaledProceduralActions(reps = 3) {
  const r = Math.max(2, Number(reps) || 3);
  const half = Math.max(2, Math.round(r * 0.7));
  const secs = Math.max(4, r + 2);
  return [
    { text: `Camina como pingüino ${r} pasos seguidos hasta la puerta de la habitación`, icon: "🐧" },
    { text: `Da ${r} saltos altos abriendo los brazos como estrella`, icon: "⭐" },
    { text: `Toca el suelo con ambas manos y levántate de un salto ${half} veces`, icon: "🐸" },
    { text: `Gira ${half} vueltas sobre tus pies con cuidado como un trompo`, icon: "🌀" },
    { text: `Camina en puntillas sin hacer ni un ruido durante ${r + 3} pasos`, icon: "🤫" },
    { text: `Haz equilibrio en un solo pie mientras cuentas en voz alta hasta ${secs}`, icon: "🦩" },
    { text: `Toca una silla con los codos y da ${r} palmadas rápidas`, icon: "🪑" },
    { text: `Aplaude ${r} veces por encima de tu cabeza y ${half} veces abajo`, icon: "👏" },
    { text: `Camina hacia atrás ${r} pasos como un cangrejo espía`, icon: "🦀" },
    { text: `Haz una pose de estatua de superhéroe sin moverte durante ${secs} segundos`, icon: "🦸‍♀️" },
    { text: `Toca el marco de la puerta ${r} veces alternando mano derecha e izquierda`, icon: "🚪" },
    { text: `Camina como un robot mecánico dando ${r} pasos por el cuarto`, icon: "🤖" },
    { text: `Cruza los brazos sobre el pecho como momia y da ${r} saltitos`, icon: "🙅‍♀️" },
    { text: `Tócate las rodillas, los hombros y la cabeza repitiendo la secuencia ${half} veces`, icon: "🙆‍♀️" },
    { text: `Da ${r} pasos gigantes de dinosaurio por la habitación`, icon: "🦖" },
    { text: `Haz como si nadaras en el aire mientras marchas en tu sitio contando hasta ${r}`, icon: "🏊‍♀️" },
    { text: `Toca dos paredes distintas de la habitación y da ${r} saltos en el centro`, icon: "👉" },
    { text: `Salta hacia adelante y hacia atrás como un canguro ${r} veces seguidas`, icon: "🦘" },
    { text: `Camina en cámara lenta como astronauta en la Luna contando hasta ${secs}`, icon: "👩‍🚀" },
    { text: `Haz ${r} sentadillas de agente élite y saluda como comandante`, icon: "🫡" }
  ];
}

const PROCEDURAL_TARGETS = [
  { item: "un lápiz, color o marcador", stepText: "Busca un lápiz, color o marcador y muéstralo frente a la cámara", icon: "✏️" },
  { item: "un peluche o muñeco pequeño", stepText: "Rescata un peluche o juguete pequeño y tráelo a la cámara", icon: "🧸" },
  { item: "un libro o cuaderno", stepText: "Busca un libro, cuento o cuaderno y muéstralo en la cámara", icon: "📚" },
  { item: "una prenda de ropa o tela de color azul", stepText: "Encuentra una prenda o tela azul y muéstrala frente a la lente", icon: "👕" },
  { item: "un cojín o almohada pequeña", stepText: "Toma un cojín o almohada pequeña y enséñalo a la cámara", icon: "🛋️" },
  { item: "un zapato, pantufla o calcetín limpio", stepText: "Busca un zapato o calcetín limpio y muéstralo en la base", icon: "👟" },
  { item: "dos objetos de colores distintos (uno en cada mano)", stepText: "Trae 2 objetos pequeños de distinto color y muéstralos juntos en cámara", icon: "🎨" },
  { item: "una cuchara pequeña o vaso de plástico seguro", stepText: "Busca una cuchara pequeña o vaso de plástico y muéstralo a la cámara", icon: "🥄" },
  { item: "una torre o par de bloques/LEGO unidos", stepText: "Une 2 o 3 bloques/piezas de juguete y muéstralos frente a la cámara", icon: "🧱" },
  { item: "un objeto redondo (pelota, tapa o cinta)", stepText: "Encuentra cualquier objeto redondo seguro y muéstralo a la cámara", icon: "⚽" },
  { item: "un objeto de color rojo o rosado", stepText: "Busca algo de color rojo o rosado en el cuarto y tráelo a la cámara", icon: "🌺" },
  { item: "un peine, cepillo o accesorio para el cabello", stepText: "Busca un peine, cepillo o liga de cabello y muéstralo a la cámara", icon: "🪮" }
];

// Lista de modelos candidatos en orden de prioridad con fallback automático
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.0-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];

// Palabras vacías a ignorar al comparar lo que dice la niña por voz con los pasos
const STOP_WORDS = new Set([
  'para', 'como', 'hasta', 'con', 'una', 'uno', 'unos', 'unas', 'del', 'los', 'las',
  'que', 'por', 'tus', 'mis', 'sus', 'este', 'esta', 'estos', 'estas', 'sobre',
  'entre', 'hacia', 'desde', 'donde', 'cuando', 'muy', 'mas', 'sin', 'cámara', 'camara',
  'base', 'lente', 'radar', 'muéstralo', 'muestralo', 'aquí', 'aqui', 'frente'
]);

// Normalizar texto sin tildes ni signos para comparación de voz flexible
function normalizeText(str = '') {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extraer palabras clave representativas de un paso
function extractStepKeywords(stepText = '') {
  const words = normalizeText(stepText).split(' ');
  return words.filter(w => (w.length >= 4 && !STOP_WORDS.has(w)) || /^\d+$/.test(w));
}

// Generador procedural único (nunca repite la misión anterior cuando se usa sin API Key)
function buildUniqueProceduralMission(stepsCount, previousTitles = [], actionReps = 6) {
  const dynamicActions = getScaledProceduralActions(actionReps);
  const shuffledActions = [...dynamicActions].sort(() => Math.random() - 0.5);
  const availableTargets = PROCEDURAL_TARGETS.filter(
    t => !previousTitles.some(prev => prev.includes(t.item))
  );
  const targetPool = availableTargets.length > 0 ? availableTargets : PROCEDURAL_TARGETS;
  const chosenTarget = targetPool[Math.floor(Math.random() * targetPool.length)];

  const actionStepsCount = Math.max(1, stepsCount - 1);
  const selectedSteps = shuffledActions.slice(0, actionStepsCount).map((act, idx) => ({
    id: idx + 1,
    text: act.text,
    icon: act.icon
  }));

  selectedSteps.push({
    id: actionStepsCount + 1,
    text: chosenTarget.stepText,
    icon: chosenTarget.icon
  });

  const codeNumber = Math.floor(100 + Math.random() * 900);
  return {
    stepsCount: selectedSteps.length,
    actionReps,
    category: `Misión Dinámica • Intensidad ${actionReps}x`,
    title: `Operación Secreta #${codeNumber}: ${chosenTarget.icon}`,
    targetItem: chosenTarget.item,
    steps: selectedSteps
  };
}

// Generador procedural de misión de recolección y orden de los objetos usados
function buildProceduralCleanupMission(objectsToClean = []) {
  const uniqueObjects = Array.from(new Set(objectsToClean.filter(Boolean)));
  const itemsList = uniqueObjects.length > 0
    ? uniqueObjects
    : ['los objetos que usaste en las misiones anteriores'];

  const cleanupSteps = itemsList.map((obj, idx) => ({
    id: idx + 1,
    text: `Toma ${obj} y devuélvelo ordenadamente a su lugar original en la casa`,
    icon: "🧹"
  }));

  cleanupSteps.push({
    id: cleanupSteps.length + 1,
    text: "Da un salto de victoria y muestra tus dos manos libres con el pulgar arriba frente a la cámara",
    icon: "👍"
  });

  return {
    isCleanupMission: true,
    stepsCount: cleanupSteps.length,
    category: '🧹 Operación Orden del Cuartel',
    title: 'Misión Especial: Guardar Artefactos Secretos',
    targetItem: 'tus manos libres haciendo señal de pulgar arriba 👍 tras haber guardado todo',
    steps: cleanupSteps
  };
}

// Meta de pasos acumulados para disparar automáticamente la Misión de Recoger Objetos
const CLEANUP_STEPS_THRESHOLD = 9;

export default function App() {
  // Manejo de Gemini API Key y Modelo
  const [apiKey, setApiKey] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('gemini_api_key')) || "";
  });
  const [activeModel, setActiveModel] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('gemini_model')) || "gemini-3.8-flash";
  });
  const [inputKey, setInputKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState(null);
  const [saveToStorage, setSaveToStorage] = useState(true);

  // Estado de Gamificación
  const [xp, setXp] = useState(140);
  const [completedCount, setCompletedCount] = useState(2);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Seguimiento de objetos usados para la Misión de Recoger Objetos
  const [usedObjects, setUsedObjects] = useState([]);
  const [stepsSinceCleanup, setStepsSinceCleanup] = useState(0);

  // Estado de la Misión Actual, Intensidad por Paso, Historial Anti-Repetición y Generador IA
  const [difficultySteps, setDifficultySteps] = useState(3);
  const [actionReps, setActionReps] = useState(8); // Cantidad de repeticiones/largo por paso (ej: 3 saltos vs 10 o 15 saltos)
  const [selectedTheme, setSelectedTheme] = useState('sorpresa');
  const [customPrompt, setCustomPrompt] = useState('');
  const [missionHistory, setMissionHistory] = useState([]);
  const [currentMission, setCurrentMission] = useState(() => buildUniqueProceduralMission(3, [], 8));
  const [aiErrorMsg, setAiErrorMsg] = useState(null);
  
  // Flujo del protocolo: 'listen' -> 'repeat' -> 'action' -> 'verify' -> 'success'
  const [phase, setPhase] = useState('listen');
  const [repeatTaps, setRepeatTaps] = useState(0); 
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState([]);

  // Reconocimiento de Voz (SpeechRecognition) para la Fase 2 (Repetir instrucciones)
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [matchedStepIdsInRep, setMatchedStepIdsInRep] = useState([]);
  const [voiceStatusMsg, setVoiceStatusMsg] = useState("");
  const [peekInstructions, setPeekInstructions] = useState(false);
  const recognitionRef = useRef(null);
  const repeatTapsRef = useRef(0);
  const cooldownRepRef = useRef(false);

  // Cámara e IA Gemini
  const [cameraActive, setCameraActive] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [isGeneratingMission, setIsGeneratingMission] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Referencias DOM
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const didInitialAIFetch = useRef(false);

  useEffect(() => {
    repeatTapsRef.current = repeatTaps;
  }, [repeatTaps]);

  useEffect(() => {
    if (showKeyModal) {
      setInputKey(apiKey);
      setKeyTestStatus(null);
    }
  }, [showKeyModal, apiKey]);

  // Función inteligente para llamar a Gemini con auto-detección de modelo
  const callGeminiWithFallback = async (key, payload, preferredModel = activeModel) => {
    const cleanKey = key.trim();
    const modelsToTry = [
      preferredModel,
      ...CANDIDATE_MODELS.filter(m => m !== preferredModel)
    ];

    let lastError = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const modelName = modelsToTry[i];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          if (modelName !== activeModel) {
            setActiveModel(modelName);
            localStorage.setItem('gemini_model', modelName);
          }
          return { data, usedModel: modelName };
        }

        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `Error HTTP ${res.status}`;
        lastError = new Error(errMsg);

        const matchSuggested = errMsg.match(/models\/(gemini-[a-zA-Z0-9.-]+)/);
        if (matchSuggested && matchSuggested[1] && !modelsToTry.includes(matchSuggested[1])) {
          modelsToTry.splice(i + 1, 0, matchSuggested[1]);
        }

        if (errMsg.toLowerCase().includes('api key not valid') || res.status === 403) {
          break;
        }
      } catch (networkErr) {
        lastError = networkErr;
      }
    }

    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
      if (listRes.ok) {
        const listData = await listRes.json();
        const availableFlash = (listData.models || [])
          .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
          .map(m => m.name.replace('models/', ''))
          .find(name => name.includes('flash') && !name.includes('2.5') && !name.includes('1.5'));

        if (availableFlash) {
          const retryUrl = `https://generativelanguage.googleapis.com/v1beta/models/${availableFlash}:generateContent?key=${cleanKey}`;
          const retryRes = await fetch(retryUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (retryRes.ok) {
            const data = await retryRes.json();
            setActiveModel(availableFlash);
            localStorage.setItem('gemini_model', availableFlash);
            return { data, usedModel: availableFlash };
          }
        }
      }
    } catch (_) {
      // Ignorar si falla el listado
    }

    throw lastError || new Error("No se pudo conectar con Gemini.");
  };

  // Rangos de Espía
  const getRank = (score) => {
    if (score >= 900) return { title: 'Directora Global de Inteligencia', badge: '👑', color: 'text-amber-300' };
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
      const { usedModel } = await callGeminiWithFallback(
        key,
        { contents: [{ parts: [{ text: "Responde únicamente: 'CONEXION_EXITOSA'" }] }] },
        activeModel
      );

      setKeyTestStatus({
        success: true,
        message: `¡Conexión exitosa con Google Gemini (modelo activo: ${usedModel})!`
      });
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

  // Guardar la Key y generar primera misión con IA inmediatamente
  const handleSaveKey = () => {
    const cleanKey = inputKey.trim();
    setApiKey(cleanKey);
    if (saveToStorage) {
      localStorage.setItem('gemini_api_key', cleanKey);
      localStorage.setItem('gemini_model', activeModel);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setShowKeyModal(false);
    SpyAudio.playSuccess();
    if (cleanKey) {
      generateNewAIMission(difficultySteps, selectedTheme, cleanKey);
    }
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

  const narrateMission = (missionToRead = currentMission) => {
    if (!missionToRead) return;
    SpyAudio.playRadar();
    const stepsSpoken = missionToRead.steps.map((s, idx) => `Paso ${idx + 1}: ${s.text}`).join(". ");
    const speech = `¡Atenta Agente! Misión "${missionToRead.title}" de ${missionToRead.steps.length} pasos. ${stepsSpoken}. Repite la misión en voz alta tres veces antes de moverte.`;
    speakText(speech);
  };

  // ================== RECONOCIMIENTO DE VOZ PARA REPETICIÓN (FASE 2) ==================
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListeningVoice(false);
  };

  const registerCompletedRepetition = (source = 'voice') => {
    if (cooldownRepRef.current) return;
    cooldownRepRef.current = true;
    setTimeout(() => {
      cooldownRepRef.current = false;
    }, 1200);

    const next = repeatTapsRef.current + 1;
    repeatTapsRef.current = next;
    setRepeatTaps(next);
    setMatchedStepIdsInRep([]);
    setLiveTranscript("");
    SpyAudio.playBeep(440 + next * 120, 'sine', 0.15);

    if (next >= 3) {
      stopVoiceRecognition();
      setVoiceStatusMsg("¡3 repeticiones completadas! ¡A cumplir la misión!");
      setTimeout(() => {
        setPhase('action');
        setIsTimerActive(true);
        SpyAudio.playSuccess();
        speakText("¡Cerebro activado! Tienes el tiempo en marcha para completar la misión en la casa.");
      }, 450);
    } else if (source === 'voice') {
      setVoiceStatusMsg(`¡Excelente! Repetición ${next} de 3 detectada por voz. ¡Repítela una vez más!`);
    }
  };

  const startVoiceRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setVoiceStatusMsg("Tu navegador no soporta reconocimiento de voz directo. Usa el botón manual de abajo.");
      return;
    }

    // Cancelar síntesis de voz si estaba hablando para que el micrófono escuche a la niña
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    stopVoiceRecognition();

    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    let accumulatedNormalized = "";

    recognition.onstart = () => {
      setIsListeningVoice(true);
      setVoiceStatusMsg("🎙️ Escuchando... Di los pasos de la misión en voz alta.");
      SpyAudio.playRadar();
    };

    recognition.onresult = (event) => {
      let interim = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += " " + transcriptPiece;
        } else {
          interim += " " + transcriptPiece;
        }
      }

      if (finalChunk) {
        accumulatedNormalized += " " + normalizeText(finalChunk);
      }

      const fullSpoken = (accumulatedNormalized + " " + normalizeText(interim)).trim();
      setLiveTranscript((finalChunk + " " + interim).trim());

      if (!fullSpoken) return;
      const spokenWords = fullSpoken.split(' ').filter(Boolean);

      // Evaluar cuántos pasos de la misión actual ya mencionó
      const matchedIds = [];
      currentMission.steps.forEach((step) => {
        const keywords = extractStepKeywords(step.text);
        if (keywords.length === 0) {
          matchedIds.push(step.id);
          return;
        }
        // Coincidencia flexible (prefijo de 4 letras para tolerar conjugaciones infantiles)
        const hasMatch = keywords.some(kw => {
          const root = kw.slice(0, Math.min(kw.length, 4));
          return spokenWords.some(sw => sw.includes(root) || root.includes(sw));
        });
        if (hasMatch) {
          matchedIds.push(step.id);
        }
      });

      setMatchedStepIdsInRep(matchedIds);

      // Umbral amigable para niños: si mencionó palabras clave de al menos la mitad de los pasos
      // (o si dijo al menos 5 palabras por paso en total describiendo la secuencia)
      const requiredStepsMatched = Math.max(1, Math.ceil(currentMission.steps.length * 0.6));
      const minSpokenWords = Math.max(4, currentMission.steps.length * 3);

      if (
        (matchedIds.length >= requiredStepsMatched && spokenWords.length >= minSpokenWords - 1) ||
        spokenWords.length >= currentMission.steps.length * 6
      ) {
        accumulatedNormalized = "";
        registerCompletedRepetition('voice');
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setVoiceStatusMsg("Permiso de micrófono denegado. Puedes darle permiso en el navegador o usar el botón manual.");
        setIsListeningVoice(false);
      }
    };

    recognition.onend = () => {
      // Si seguimos en la fase 'repeat' y aún faltan repeticiones, mantener el micrófono activo
      if (recognitionRef.current && repeatTapsRef.current < 3) {
        try {
          recognition.start();
        } catch (_) {
          setIsListeningVoice(false);
        }
      } else {
        setIsListeningVoice(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn("No se pudo iniciar SpeechRecognition:", e);
    }
  };

  // Detener micrófono al salir de la fase 'repeat' y reiniciar vista de pista
  useEffect(() => {
    setPeekInstructions(false);
    if (phase !== 'repeat') {
      stopVoiceRecognition();
      setLiveTranscript("");
      setMatchedStepIdsInRep([]);
      setVoiceStatusMsg("");
    }
    return () => stopVoiceRecognition();
  }, [phase]);

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

  // Limpiar JSON devuelto por el modelo
  const parseCleanJson = (rawText) => {
    if (!rawText) throw new Error("Respuesta vacía de la IA");
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    return JSON.parse(cleaned);
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

    if (!apiKey.trim()) {
      setTimeout(() => {
        setIsAnalyzingAI(false);
        const fallbackResult = {
          cumplido: true,
          mensaje_divertido: "¡Gran trabajo agente! Sensores locales confirman el objetivo. (Tip: Añade tu API Key de Gemini para activar la visión artificial en vivo).",
          detalles_observados: "Validación por sensor interno del Cuartel."
        };
        setAiFeedback(fallbackResult);
        handleMissionVictory(fallbackResult.mensaje_divertido);
      }, 1000);
      return;
    }

    const base64Data = photoDataUrl.split(',')[1];

    const promptText = `Eres el Cuartel General de una Academia Secreta de Espías para niñas. 
Evalúa con cariño, motivación y entusiasmo si la niña cumplió la misión física.
La misión solicitaba mostrar al final: "${currentMission.targetItem || currentMission.title}".
Pasos completos asignados (${currentMission.steps.length} pasos): ${currentMission.steps.map(s => s.text).join(' | ')}.

Observa con atención la foto enviada desde la webcam.
¿Se observa en la imagen el objeto, la construcción, la persona haciendo la señal/acción, o el elemento solicitado (${currentMission.targetItem})? 
Sé muy tolerante con la iluminación, reflejos o si la niña sostiene el objeto o muestra sus manos/pulgar arriba.

Responde ÚNICAMENTE un objeto JSON válido con este formato:
{
  "cumplido": true,
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
      const { data } = await callGeminiWithFallback(apiKey, payload);
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = parseCleanJson(rawJson);

      setAiFeedback(parsed);

      if (parsed.cumplido) {
        handleMissionVictory(parsed.mensaje_divertido);
      } else {
        SpyAudio.playAlarm();
        speakText("Casi lo tenemos, agente. " + (parsed.mensaje_divertido || "Muestra el resultado un poco más cerca de la cámara."));
      }
    } catch (e) {
      console.warn("Fallo en análisis visual:", e);
      const fallbackResult = {
        cumplido: true,
        mensaje_divertido: "¡Nuestros radares de respaldo confirman que lo lograste con éxito!",
        detalles_observados: `Aprobado por sensor alterno (${e.message || 'Sin conexión'})`
      };
      setAiFeedback(fallbackResult);
      handleMissionVictory(fallbackResult.mensaje_divertido);
    } finally {
      setIsAnalyzingAI(false);
      setIsGeneratingMission(false);
    }
  };

  // Victoria de Misión + Registro de Objetos Usados para la Misión de Orden
  const handleMissionVictory = (cheerMessage) => {
    SpyAudio.playSuccess();
    setPhase('success');

    const isCleanup = Boolean(currentMission.isCleanupMission);
    const points = currentMission.steps.length * 30 + (isCleanup ? 60 : 0);
    setXp(x => x + points);
    setCompletedCount(c => c + 1);

    if (isCleanup) {
      // Si acaba de completar la misión de recoger objetos, vaciar la lista de objetos pendientes
      setUsedObjects([]);
      setStepsSinceCleanup(0);
      speakText(cheerMessage || "¡Cuartel General impecable! Guardaste todos los objetos secretos en su lugar y ganaste un bono extra.");
    } else {
      // Registrar el objeto que se usó en esta misión y sumar los pasos acumulados
      if (currentMission.targetItem) {
        setUsedObjects(prev => {
          if (prev.includes(currentMission.targetItem)) return prev;
          return [...prev, currentMission.targetItem];
        });
      }
      setStepsSinceCleanup(prev => prev + currentMission.steps.length);
      speakText(cheerMessage || "¡Misión secreta cumplida con honores! Tu memoria operativa está en nivel supremo.");
    }
  };

  // Generador de Misión Especial para RECOGER Y GUARDAR los objetos usados en las actividades previas
  const generateCleanupMission = async (objectsList = usedObjects) => {
    const itemsToClean = objectsList.length > 0
      ? objectsList
      : [currentMission.targetItem || 'los objetos usados en tus misiones'];

    const activeKeyToUse = apiKey.trim();

    if (!activeKeyToUse) {
      const localCleanup = buildProceduralCleanupMission(itemsToClean);
      setCurrentMission(localCleanup);
      resetMissionFlow(localCleanup.steps.length);
      SpyAudio.playSuccess();
      speakText(`¡Alerta de Orden del Cuartel! Es hora de recoger y guardar en su lugar los objetos que usamos: ${itemsToClean.join(', ')}.`);
      return;
    }

    setIsAnalyzingAI(true);
    setIsGeneratingMission(true);
    setPhase('listen');
    setAiErrorMsg(null);
    SpyAudio.playRadar();

    const totalCleanupSteps = Math.max(itemsToClean.length + 1, difficultySteps);

    const prompt = `Eres el Cuartel General de una Academia de Espías para niñas.
En las misiones anteriores la agente utilizó estos objetos reales de su casa y ahora están fuera de su sitio:
OBJETOS USADOS QUE DEBE RECOGER Y GUARDAR:
${itemsToClean.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Crea una "🧹 Misión Especial de Orden Secreto" de EXACTAMENTE ${totalCleanupSteps} pasos secuenciales donde:
- La niña deba recoger cada uno de esos objetos (${itemsToClean.join(', ')}) y llevarlos de vuelta a su lugar correcto en la casa de forma divertida (ej: caminando como ninja, en puntillas, dando un giro al guardarlo, etc.).
- El último paso (Paso ${totalCleanupSteps}) SIEMPRE debe ser regresar a la cámara y mostrar sus dos manos vacías con los pulgares arriba 👍 para demostrar que ya guardó todo.

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura:
{
  "title": "Operación Cuartel Impecable: Guardar Evidencias",
  "category": "🧹 Misión Especial de Orden",
  "targetItem": "tus dos manos libres con los pulgares arriba 👍 tras guardar todos los objetos",
  "steps": [
    { "id": 1, "text": "Paso 1 para recoger y guardar el primer objeto en su sitio", "icon": "🧹" }
  ]
}`;

    try {
      const { data, usedModel } = await callGeminiWithFallback(activeKeyToUse, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.85
        }
      });

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const missionJson = parseCleanJson(rawText);

      if (missionJson.steps && Array.isArray(missionJson.steps) && missionJson.steps.length > 0) {
        const normalizedSteps = missionJson.steps.map((s, idx) => ({
          id: idx + 1,
          text: s.text || `Guarda el objeto ${idx + 1} en su sitio`,
          icon: s.icon || "🧹"
        }));
        const cleanupMission = {
          ...missionJson,
          isAI: true,
          isCleanupMission: true,
          modelUsed: usedModel,
          stepsCount: normalizedSteps.length,
          steps: normalizedSteps
        };
        setCurrentMission(cleanupMission);
        resetMissionFlow(normalizedSteps.length);
        SpyAudio.playSuccess();
        speakText(`¡Misión Especial de Orden del Cuartel! Vamos a guardar en su lugar los objetos que usamos.`);
      } else {
        throw new Error("Formato inválido");
      }
    } catch (e) {
      console.warn("Usando misión de orden procedural:", e);
      const localCleanup = buildProceduralCleanupMission(itemsToClean);
      setCurrentMission(localCleanup);
      resetMissionFlow(localCleanup.steps.length);
    } finally {
      setIsAnalyzingAI(false);
      setIsGeneratingMission(false);
    }
  };

  // Avanzar a la siguiente misión (verifica automáticamente si ya toca recoger los objetos usados)
  const handleNextMission = async (targetSteps = difficultySteps, themeId = selectedTheme) => {
    const shouldTriggerCleanup =
      !currentMission.isCleanupMission &&
      usedObjects.length >= 2 &&
      (stepsSinceCleanup >= CLEANUP_STEPS_THRESHOLD || usedObjects.length >= 3);

    if (shouldTriggerCleanup) {
      await generateCleanupMission(usedObjects);
    } else {
      await generateNewAIMission(targetSteps, themeId);
    }
  };

  // Generador de Misiones e Instrucciones con Gemini IA (con memoria anti-repetición e intensidad configurable)
  const generateNewAIMission = async (
    stepsToGenerate = difficultySteps,
    themeId = selectedTheme,
    overrideKey = apiKey,
    repsToUse = actionReps
  ) => {
    const targetSteps = typeof stepsToGenerate === 'number' ? stepsToGenerate : difficultySteps;
    const targetReps = typeof repsToUse === 'number' ? repsToUse : actionReps;
    const activeKeyToUse = (typeof overrideKey === 'string' ? overrideKey : apiKey).trim();

    if (!activeKeyToUse) {
      const procMission = buildUniqueProceduralMission(targetSteps, missionHistory, targetReps);
      setMissionHistory(prev => [...prev.slice(-15), `${procMission.title} (${procMission.targetItem})`]);
      setCurrentMission(procMission);
      resetMissionFlow(procMission.steps.length, targetReps);
      SpyAudio.playSuccess();
      return;
    }

    setIsAnalyzingAI(true);
    setIsGeneratingMission(true);
    setPhase('listen');
    setAiErrorMsg(null);
    SpyAudio.playRadar();

    const themeObj = AI_THEMES.find(t => t.id === themeId) || AI_THEMES[0];
    const randomScenario = CREATIVE_SCENARIOS[Math.floor(Math.random() * CREATIVE_SCENARIOS.length)];
    const randomSeedId = Math.floor(10000 + Math.random() * 90000);

    const recentHistoryList = [
      `${currentMission.title} -> objeto: ${currentMission.targetItem} -> pasos: ${currentMission.steps.map(s => s.text).join('; ')}`,
      ...missionHistory.slice(-10)
    ].join('\n- ');

    const themeInstruction = customPrompt.trim()
      ? `Instrucción especial solicitada por la familia: "${customPrompt.trim()}".`
      : `Temática elegida: ${themeObj.label} — ${themeObj.prompt}`;

    const stepsTemplateExample = Array.from({ length: targetSteps }, (_, idx) => {
      const isLast = idx === targetSteps - 1;
      return `    { "id": ${idx + 1}, "text": "${
        isLast
          ? 'Último paso: traer el objeto o mostrar el resultado frente a la cámara'
          : `Acción física con ~${targetReps} repeticiones o ${targetReps + 4} segundos (ej: dar ${targetReps} saltos, ${targetReps} pasos gigantes, ${targetReps} palmadas, etc.)`
      }", "icon": "✨" }`;
    }).join(',\n');

    const prompt = `Eres un diseñador experto en neuroeducación infantil y juegos de espías para entrenar la memoria operativa (memoria de trabajo) y el seguimiento de instrucciones secuenciales.

Semilla creativa única: #${randomSeedId} — Inspiración de estilo: "${randomScenario}".
Crea una misión física TOTALMENTE NUEVA, original y diferente a las anteriores para realizar dentro de casa.
CANTIDAD OBLIGATORIA DE PASOS: EXACTAMENTE ${targetSteps} pasos secuenciales (numerados del 1 al ${targetSteps}).
LARGO E INTENSIDAD DE CADA PASO: Nivel ${targetReps}x — Cada paso de movimiento o ejercicio debe pedir alrededor de ${targetReps} repeticiones (por ejemplo: "${targetReps} saltos", "${targetReps} sentadillas", "${targetReps} pasos de gigante", "${targetReps} palmadas", o mantener equilibrio por ${targetReps + 4} segundos) y puede combinar dos detalles en la misma oración cuando la intensidad es alta (${targetReps} >= 8).
${themeInstruction}

HISTORIAL DE MISIONES YA JUGADAS (PROHIBIDO REPETIR ESTOS TÍTULOS, OBJETOS O MISMAS ACCIONES):
- ${recentHistoryList}

REGLAS OBLIGATORIAS:
1. PROHIBIDO repetir el objeto final ("${currentMission.targetItem}") ni los mismos pasos de la misión anterior. Inventa movimientos físicos distintos y pide un objeto casero diferente.
2. Usa cantidades cercanas a ${targetReps} en los ejercicios de cada paso (ej: en lugar de pedir solo 2 o 3 saltos, pide ${targetReps} saltos, ${targetReps} pasos, ${targetReps} toques o ${targetReps + 4} segundos).
3. El paso final (Paso ${targetSteps}) SIEMPRE debe pedir traer el nuevo objeto o mostrar la prueba frente a la cámara de la base.
4. La lista "steps" debe tener EXACTAMENTE ${targetSteps} elementos.

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "title": "Nombre creativo y nuevo de operación espía",
  "category": "IA • ${themeObj.label.replace(/^[^\s]+\s/, '')} (${targetReps}x)",
  "targetItem": "descripción breve del nuevo objeto o resultado a mostrar ante la cámara al final",
  "steps": [
${stepsTemplateExample}
  ]
}`;

    try {
      const { data, usedModel } = await callGeminiWithFallback(activeKeyToUse, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 1.0
        }
      });

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const missionJson = parseCleanJson(rawText);

      if (missionJson.steps && Array.isArray(missionJson.steps) && missionJson.steps.length > 0) {
        const normalizedSteps = missionJson.steps.map((s, idx) => ({
          id: idx + 1,
          text: s.text || `Paso secreto ${idx + 1}`,
          icon: s.icon || "🕵️‍♀️"
        }));
        const newMission = {
          ...missionJson,
          isAI: true,
          isCleanupMission: false,
          actionReps: targetReps,
          modelUsed: usedModel,
          stepsCount: normalizedSteps.length,
          steps: normalizedSteps
        };
        setMissionHistory(prev => [
          ...prev.slice(-15),
          `${newMission.title} -> objeto: ${newMission.targetItem} -> pasos: ${normalizedSteps.map(s => s.text).join('; ')}`
        ]);
        setCurrentMission(newMission);
        resetMissionFlow(normalizedSteps.length, targetReps);
        SpyAudio.playSuccess();
        speakText(`¡Nueva misión secreta de ${normalizedSteps.length} pasos con intensidad ${targetReps}! ${newMission.title}.`);
      } else {
        throw new Error("El formato de pasos devuelto por la IA no fue válido.");
      }
    } catch (e) {
      console.warn("Fallo al generar misión con IA:", e);
      setAiErrorMsg(`Aviso IA (${e.message}). Se generó una misión dinámica nueva de ${targetSteps} pasos.`);
      const procMission = buildUniqueProceduralMission(targetSteps, missionHistory, targetReps);
      setMissionHistory(prev => [...prev.slice(-15), `${procMission.title} (${procMission.targetItem})`]);
      setCurrentMission(procMission);
      resetMissionFlow(procMission.steps.length, targetReps);
    } finally {
      setIsAnalyzingAI(false);
      setIsGeneratingMission(false);
    }
  };

  // Si el usuario ya tiene su API Key guardada al abrir la app, generar la primera misión con IA automáticamente
  useEffect(() => {
    if (!didInitialAIFetch.current && apiKey.trim()) {
      didInitialAIFetch.current = true;
      generateNewAIMission(difficultySteps, selectedTheme, apiKey);
    }
  }, []);

  // Añadir un paso adicional con IA o dinámicamente a la misión actual
  const addExtraStepToCurrentMission = async () => {
    const nextStepNum = currentMission.steps.length + 1;
    if (nextStepNum > 12) return;
    setDifficultySteps(nextStepNum);
    await generateNewAIMission(nextStepNum, selectedTheme);
  };

  const resetMissionFlow = (stepsCount = difficultySteps, repsCount = actionReps) => {
    setPhase('listen');
    setRepeatTaps(0);
    repeatTapsRef.current = 0;
    const perStepSeconds = 25 + Math.round(repsCount * 1.5);
    setTimerSeconds(Math.max(60, stepsCount * perStepSeconds));
    setIsTimerActive(false);
    setCheckedSteps([]);
    setCapturedImage(null);
    setAiFeedback(null);
  };

  const selectStepDifficulty = (num) => {
    setDifficultySteps(num);
    setAiErrorMsg(null);
    generateNewAIMission(num, selectedTheme, apiKey, actionReps);
  };

  const selectActionReps = (newReps) => {
    setActionReps(newReps);
    setAiErrorMsg(null);
    generateNewAIMission(difficultySteps, selectedTheme, apiKey, newReps);
  };

  const isCleanupNext =
    !currentMission.isCleanupMission &&
    usedObjects.length >= 2 &&
    (stepsSinceCleanup >= CLEANUP_STEPS_THRESHOLD || usedObjects.length >= 3);

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
            {/* Botón rápido de Misión de Orden si hay objetos usados */}
            {usedObjects.length > 0 && (
              <button
                onClick={() => generateCleanupMission(usedObjects)}
                disabled={isGeneratingMission}
                title={`Objetos por guardar: ${usedObjects.join(', ')}`}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                  isCleanupNext
                    ? 'bg-teal-950/90 border-teal-400 text-teal-200 animate-bounce'
                    : 'bg-slate-800/90 border-slate-700 text-teal-300 hover:bg-slate-700'
                }`}
              >
                <span>🧹</span>
                <span className="hidden md:inline">Recoger Objetos</span>
                <span className="bg-teal-500/20 border border-teal-400/40 text-teal-200 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                  {usedObjects.length}
                </span>
              </button>
            )}

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
                {apiKey.trim() ? `IA Activa (${activeModel})` : 'Configurar Key IA'}
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
        
        {/* Panel de Configuración de Pasos + Generador de Instrucciones con IA */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Cantidad de Pasos en Memoria Operativa</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Elige de 2 a 8+ pasos. Cada cierta cantidad de pasos se activará una misión especial para guardar los objetos usados.
              </p>
            </div>

            {/* Botones de 2 a 8 pasos */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[2, 3, 4, 5, 6, 7, 8].map(num => (
                <button
                  key={num}
                  onClick={() => selectStepDifficulty(num)}
                  disabled={isAnalyzingAI}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all disabled:opacity-50 ${
                    difficultySteps === num
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-105'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {num} Pasos
                </button>
              ))}

              <button
                onClick={addExtraStepToCurrentMission}
                disabled={isAnalyzingAI || currentMission.steps.length >= 12}
                title="Añadir un paso más a la misión"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-black text-xs flex items-center gap-1 transition-all disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Paso</span>
              </button>
            </div>
          </div>

          {/* Control de Largo / Intensidad de cada paso (Slider + Botones rápidos: ej. 3 saltos vs 10 o 20 saltos) */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Largo / Repeticiones dentro de cada paso: <strong className="text-amber-300 text-sm">{actionReps}x</strong></span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Define si cada paso pide acciones cortas (ej: 3 saltos) o largas (ej: {actionReps} saltos, {actionReps} pasos o {actionReps + 4}s de equilibrio).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Slider continuo de 2 a 20 repeticiones */}
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400">2x</span>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={actionReps}
                  onChange={(e) => setActionReps(Number(e.target.value))}
                  onMouseUp={(e) => selectActionReps(Number(e.currentTarget.value))}
                  onTouchEnd={(e) => selectActionReps(Number(e.currentTarget.value))}
                  disabled={isAnalyzingAI}
                  className="w-28 sm:w-36 accent-cyan-400 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-slate-400">20x</span>
              </div>

              {/* Botones rápidos de intensidad */}
              <div className="flex items-center gap-1.5">
                {[
                  { label: '⚡ 3x Corto', val: 3 },
                  { label: '🔥 6x Medio', val: 6 },
                  { label: '💪 10x Largo', val: 10 },
                  { label: '🚀 15x Intenso', val: 15 },
                  { label: '👑 20x Extremo', val: 20 }
                ].map(preset => (
                  <button
                    key={preset.val}
                    onClick={() => selectActionReps(preset.val)}
                    disabled={isAnalyzingAI}
                    className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] transition-all disabled:opacity-50 ${
                      actionReps === preset.val
                        ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/30 scale-105'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Barra de progreso hacia la siguiente Misión de Recoger Objetos */}
          {usedObjects.length > 0 && (
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <span>🧹 Objetos usados en actividades recientes ({usedObjects.length}):</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    ({Math.min(stepsSinceCleanup, CLEANUP_STEPS_THRESHOLD)}/{CLEANUP_STEPS_THRESHOLD} pasos para Misión de Orden automática)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {usedObjects.map((obj, i) => (
                    <span key={i} className="text-[11px] bg-teal-950/60 border border-teal-700/50 text-teal-200 px-2 py-0.5 rounded-lg">
                      • {obj}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => generateCleanupMission(usedObjects)}
                disabled={isGeneratingMission}
                className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shrink-0 shadow-md shadow-teal-500/10 transition-all"
              >
                🧹 Lanzar Misión de Recoger Ahora
              </button>
            </div>
          )}

          {/* Barra del Generador de Instrucciones con IA */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-purple-300 font-bold mr-1 flex items-center gap-1">
                <Wand2 className="w-3.5 h-3.5" />
                Temática IA:
              </span>
              {AI_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setSelectedTheme(theme.id);
                    generateNewAIMission(difficultySteps, theme.id);
                  }}
                  disabled={isAnalyzingAI}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                    selectedTheme === theme.id
                      ? 'bg-purple-950/90 border-purple-500 text-purple-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {theme.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') generateNewAIMission(difficultySteps, selectedTheme);
                }}
                placeholder="Opcional: escribe qué quieres en la misión (ej: 'con cojines en la sala', 'buscar algo verde y un libro')..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500"
              />

              <button
                onClick={() => generateNewAIMission(difficultySteps, selectedTheme)}
                disabled={isAnalyzingAI}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all shrink-0"
              >
                <Sparkles className={`w-4 h-4 ${isAnalyzingAI ? 'animate-spin' : ''}`} />
                <span>
                  {isAnalyzingAI
                    ? `Inventando ${difficultySteps} instrucciones...`
                    : `Inventar Nueva Misión IA (${difficultySteps} Pasos)`}
                </span>
              </button>
            </div>

            {aiErrorMsg && (
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-center justify-between gap-2">
                <span>⚠️ {aiErrorMsg}</span>
                <button onClick={() => setAiErrorMsg(null)} className="text-amber-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
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
            <span>2. Repetir (Voz)</span>
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
        <div className={`bg-slate-900 border rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden ${
          currentMission.isCleanupMission ? 'border-teal-500/70' : 'border-slate-800'
        }`}>
          
          {/* Pantalla dedicada de carga mientras Gemini IA inventa la misión */}
          {isGeneratingMission ? (
            <div className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-5 animate-pulse">
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-purple-500/30 border-t-purple-400 animate-spin" />
                <Sparkles className="w-8 h-8 text-amber-400 absolute animate-bounce" />
              </div>
              <div className="space-y-2 max-w-md">
                <span className="text-[11px] font-mono uppercase tracking-widest bg-purple-950/90 border border-purple-500/50 text-purple-300 px-3 py-1 rounded-full font-bold">
                  transmisor gemini ia activo
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white pt-1">
                  Inventando nueva misión secreta de {difficultySteps} pasos...
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  El Cuartel General está diseñando instrucciones físicas nuevas que no se hayan repetido antes.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Encabezado de la Misión */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs border px-2.5 py-0.5 rounded-md font-mono ${
                      currentMission.isCleanupMission
                        ? 'bg-teal-950 border-teal-500/60 text-teal-300 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}>
                      {currentMission.category}
                    </span>
                    {currentMission.isAI && (
                      <span className="text-[11px] bg-purple-950/80 border border-purple-500/50 text-purple-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Creada por IA ({currentMission.modelUsed || activeModel})
                      </span>
                    )}
                    <span className="text-xs text-amber-400 font-bold">
                      {currentMission.steps.length} Acciones Consecutivas
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {currentMission.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => generateNewAIMission(difficultySteps, selectedTheme)}
                    disabled={isAnalyzingAI}
                    title="Inventar otra misión distinta ahora"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingAI ? 'animate-spin' : ''}`} />
                    <span>Otra Prueba</span>
                  </button>

                  <button
                    onClick={() => narrateMission()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-700/60 hover:bg-cyan-900 text-cyan-300 text-xs font-black shadow-md transition-all"
                  >
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>Escuchar Instrucciones</span>
                  </button>
                </div>
              </div>

              {/* Lista de Pasos Encadenados */}
              <div className="my-6 space-y-3">
                {phase === 'repeat' && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Modo Memoria Activa: Instrucciones ocultas para recordar sin leer</span>
                    </span>
                    <button
                      onClick={() => setPeekInstructions(p => !p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-[11px] flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{peekInstructions ? 'Ocultar Pista' : 'Ver Pista'}</span>
                    </button>
                  </div>
                )}

                {currentMission.steps.map((st, idx) => {
                  const isChecked = checkedSteps.includes(st.id);
                  const isVoiceDetected = phase === 'repeat' && matchedStepIdsInRep.includes(st.id);
                  const isBlurredForMemory = phase === 'repeat' && !peekInstructions;
                  return (
                    <div
                      key={st.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        isVoiceDetected
                          ? 'bg-amber-950/40 border-amber-400 shadow-md shadow-amber-950/30'
                          : phase === 'action'
                          ? 'bg-slate-800/70 border-slate-700 hover:border-slate-500'
                          : 'bg-slate-900/60 border-slate-800'
                      } ${isChecked ? 'bg-emerald-950/20 border-emerald-600/40 text-slate-300' : ''}`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center text-lg font-black shadow-sm shrink-0 transition-all ${
                          isBlurredForMemory ? 'blur-sm select-none' : ''
                        }`}>
                          {st.icon || idx + 1}
                        </div>
                        <div>
                          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                            <span>Paso {idx + 1} de {currentMission.steps.length}</span>
                            {isVoiceDetected && (
                              <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full font-black">
                                🎙️ ¡Recordado en voz alta!
                              </span>
                            )}
                          </div>
                          <div className={`text-base font-bold text-white transition-all duration-300 ${
                            isBlurredForMemory ? 'blur-md select-none opacity-65' : ''
                          }`}>
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
                          className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
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
                      Paso 1: Memoriza la secuencia de {currentMission.steps.length} pasos
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Léele o haz clic en "Escuchar Instrucciones". Aún no debe pararse de su asiento.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      SpyAudio.playSuccess();
                      setPhase('repeat');
                      speakText(`¡Muy bien! Ahora activa el micrófono y repite los ${currentMission.steps.length} pasos en voz alta tres veces.`);
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                  >
                    <span>¡Instrucciones Escuchadas!</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ================= FASE 2: REPETIR EN VOZ ALTA CON RECONOCIMIENTO DE VOZ ================= */}
              {phase === 'repeat' && (
                <div className="p-5 rounded-2xl bg-amber-950/30 border-2 border-dashed border-amber-500/60 space-y-5 text-center">
                  <div className="max-w-lg mx-auto space-y-1">
                    <span className="text-3xl">🎙️🗣️</span>
                    <h4 className="text-base sm:text-lg font-black text-amber-300">
                      ¡Reconocimiento de Voz de Espía ({repeatTaps}/3 Repeticiones)!
                    </h4>
                    <p className="text-xs text-amber-200/80">
                      Activa el micrófono y dile a la niña que repita los {currentMission.steps.length} pasos en voz alta. El radar detectará su voz automáticamente.
                    </p>
                  </div>

                  {/* Controles de Micrófono en Vivo */}
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => {
                        if (isListeningVoice) {
                          stopVoiceRecognition();
                        } else {
                          startVoiceRecognition();
                        }
                      }}
                      className={`px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl flex items-center gap-3 transition-all ${
                        isListeningVoice
                          ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/30 animate-pulse'
                          : 'bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 shadow-cyan-500/20'
                      }`}
                    >
                      {isListeningVoice ? (
                        <>
                          <Mic className="w-5 h-5 animate-bounce" />
                          <span>Escuchando tu voz en vivo... (Clic para pausar)</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5" />
                          <span>Activar Micrófono para Repetir Instrucciones</span>
                        </>
                      )}
                    </button>

                    {/* Transcripción en vivo de lo que dice la niña */}
                    {(isListeningVoice || liveTranscript || voiceStatusMsg) && (
                      <div className="w-full max-w-xl p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-left space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400">
                          <span>{voiceStatusMsg || "🎙️ Radar de voz activo"}</span>
                          <span>Pasos detectados: {matchedStepIdsInRep.length}/{currentMission.steps.length}</span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-200 italic min-h-[1.5rem]">
                          {liveTranscript ? `"${liveTranscript}"` : "Habla cerca del micrófono mencionando los pasos..."}
                        </div>
                      </div>
                    )}

                    {/* Botón manual de respaldo / confirmación rápida */}
                    <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => registerCompletedRepetition('manual')}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-2 transition-all"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Sumar Repetición Manual ({repeatTaps}/3)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= FASE 3: EJECUTAR EN EL MUNDO REAL ================= */}
              {phase === 'action' && (
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-black text-lg text-amber-400">
                        {timerSeconds}s
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">
                          ¡Misión de {currentMission.steps.length} Pasos en Curso!
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
                          <span>RADAR_ESPÍA: {apiKey ? activeModel.toUpperCase() : 'MODO_LOCAL'}</span>
                          <span className="animate-pulse">● REC</span>
                        </div>
                        <div className="w-16 h-16 border-2 border-dashed border-cyan-400/70 rounded-xl mx-auto opacity-75"></div>
                        <div className="text-center text-[11px] text-cyan-300 font-mono bg-black/60 py-1 rounded">
                          Centra aquí el objeto o señal solicitada
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
                  <div className="text-6xl animate-bounce">
                    {currentMission.isCleanupMission ? '🧹✨' : '🏆'}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-300">
                    {currentMission.isCleanupMission
                      ? '¡CUARTEL ORDENADO E IMPECABLE!'
                      : `¡MISIÓN DE ${currentMission.steps.length} PASOS CUMPLIDA!`}
                  </h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto">
                    {currentMission.isCleanupMission
                      ? '¡Todos los objetos de las actividades anteriores fueron devueltos a su lugar con éxito!'
                      : `Tu hija escuchó, repitió en voz alta y ejecutó las ${currentMission.steps.length} instrucciones en el espacio físico.`}
                  </p>

                  <div className="inline-flex items-center gap-2 bg-emerald-900/60 border border-emerald-600/60 px-4 py-2 rounded-xl text-emerald-300 font-bold text-sm">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>
                      +{currentMission.steps.length * 30 + (currentMission.isCleanupMission ? 60 : 0)} Puntos de Memoria Ganados
                    </span>
                  </div>

                  {/* Aviso si ya toca la misión de recoger objetos */}
                  {isCleanupNext && (
                    <div className="max-w-md mx-auto p-3 rounded-2xl bg-teal-950/80 border border-teal-400/60 text-teal-200 text-xs font-bold">
                      🧹 ¡Ya acumulaste {usedObjects.length} objetos en campo! La siguiente misión será una Operación Especial para guardarlos en su sitio.
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => handleNextMission(difficultySteps, selectedTheme)}
                      disabled={isAnalyzingAI}
                      className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {isCleanupNext
                          ? `🧹 Iniciar Misión de Recoger Objetos (${usedObjects.length}) ➔`
                          : `Siguiente Misión Nueva con IA (${difficultySteps} Pasos) ➔`}
                      </span>
                    </button>

                    <button
                      onClick={() => selectStepDifficulty(Math.min(10, difficultySteps + 1))}
                      disabled={isAnalyzingAI}
                      className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-xl shadow-purple-900/30 flex items-center gap-2 disabled:opacity-50"
                    >
                      <span>Subir Nivel a {Math.min(10, difficultySteps + 1)} Pasos 🚀</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Guía Pedagógica para los Padres */}
        <footer className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Por qué funciona este método en la vida real:</span>
          </div>
          <p>
            Al forzar a la niña a <strong>repetir la orden en voz alta en el micrófono antes de moverse</strong>, transformamos una instrucción externa en <em>habla subvocal autodirigida</em>. Además, las misiones periódicas de recolección cierran el ciclo ejecutivo enseñándole a dejar su espacio en orden.
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
                  <p className="text-xs text-slate-400">Activa la visión artificial con cámara y generación de instrucciones IA</p>
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

            {/* Selector de Modelo con Auto-Fallback */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Modelo Preferido (con detección automática):
              </label>
              <select
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200"
              >
                {CANDIDATE_MODELS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
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
                {keyTestStatus.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
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
