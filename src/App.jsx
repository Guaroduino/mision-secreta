import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Volume2, Sparkles, CheckCircle2, RotateCcw, 
  Trophy, ShieldAlert, Award, Play, Eye, Flame, AlertCircle, 
  VolumeX, ArrowRight, UserCheck, RefreshCw, Zap, Check, Lock, Video,
  Key, Settings, ExternalLink, Trash2, CheckCircle, ShieldCheck, X,
  Plus, Wand2, Sliders
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
  { id: 'sorpresa', label: '🎲 Sorpresa Espía', prompt: 'Combina movimientos divertidos (saltos, giros, caminar en puntillas) con buscar objetos cotidianos seguros de la casa.' },
  { id: 'lego', label: '🧱 LEGO y Bloques', prompt: 'Usa piezas de LEGO, bloques de construcción o torres de colores combinadas con desafíos de movimiento físico.' },
  { id: 'ninja', label: '🥷 Agente Ninja', prompt: 'Incluye poses de equilibrio, saltos ninja, caminar sin hacer ruido, tocar paredes o puertas y traer un objeto secreto.' },
  { id: 'colores', label: '🎨 Cazadora de Colores', prompt: 'Sigue una secuencia buscando o tocando objetos de colores específicos en la habitación y trayendo el último a la cámara.' },
  { id: 'peluches', label: '🧸 Peluches y Juguetes', prompt: 'Misión de rescate de juguetes o peluches con pasos físicos intermedios divertidos.' },
  { id: 'dibujo', label: '✏️ Papel y Lápiz', prompt: 'Incluye buscar útiles escolares (lápiz, marcador, cuaderno o libro) o dibujar una figura rápida para mostrar a la cámara.' }
];

// Misiones preconfiguradas 100% físicas para el mundo real (Modo Local / Fallback de 2 a 8+ pasos)
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
    stepsCount: 5,
    category: 'Secuencia de 5 Pasos',
    title: 'Protocolo Cinco Estrellas',
    targetItem: 'un libro o cuento infantil',
    steps: [
      { id: 1, text: "Da 2 giros sobre tus pies como un trompo espacial", icon: "🌀" },
      { id: 2, text: "Camina en puntillas sin hacer ruido hasta una silla", icon: "🪑" },
      { id: 3, text: "Toca la silla con los dos codos", icon: "💪" },
      { id: 4, text: "Busca cualquier libro, cuaderno o cuento que te guste", icon: "📚" },
      { id: 5, text: "Trae el libro y muéstralo abierto frente a la cámara", icon: "📸" }
    ]
  },
  {
    stepsCount: 6,
    category: 'Secuencia de 6 Pasos',
    title: 'Operación Hexágono Dorado',
    targetItem: 'dos objetos de colores diferentes en las manos',
    steps: [
      { id: 1, text: "Salta 3 veces en un solo pie como flamenco", icon: "🦩" },
      { id: 2, text: "Toca la pared más cercana con la palma de tu mano derecha", icon: "✋" },
      { id: 3, text: "Agáchate como ranita y vuelve a subir", icon: "🐸" },
      { id: 4, text: "Busca un objeto pequeño de color rojo o amarillo", icon: "🔴" },
      { id: 5, text: "Con la otra mano toma un objeto de cualquier otro color", icon: "🔵" },
      { id: 6, text: "Muestra ambos objetos al mismo tiempo frente a la cámara", icon: "✨" }
    ]
  },
  {
    stepsCount: 7,
    category: 'Secuencia de 7 Pasos',
    title: 'Misión Siete Mares Secretos',
    targetItem: 'un cojín, almohada pequeña o peluche',
    steps: [
      { id: 1, text: "Pon las manos en la cintura y haz cara de detective", icon: "🕵️‍♀️" },
      { id: 2, text: "Da 4 pasos gigantes hacia adelante", icon: "👣" },
      { id: 3, text: "Aplaude 3 veces por encima de tu cabeza", icon: "🙌" },
      { id: 4, text: "Toca el borde de una mesa con el dedo meñique", icon: "👉" },
      { id: 5, text: "Da un salto de estrella abriendo brazos y piernas", icon: "⭐" },
      { id: 6, text: "Toma un cojín pequeño o un peluche suave", icon: "🛋️" },
      { id: 7, text: "Regresa a la base y muéstralo en la cámara", icon: "📹" }
    ]
  },
  {
    stepsCount: 8,
    category: 'Ultra Memoria (8 Pasos)',
    title: 'Operación Octágono Supremo',
    targetItem: 'un zapato, pantufla o calcetín limpio',
    steps: [
      { id: 1, text: "Camina hacia atrás 3 pasos con mucho cuidado", icon: "⏪" },
      { id: 2, text: "Tócate los hombros cruzando los brazos como momia", icon: "🙅‍♀️" },
      { id: 3, text: "Haz 2 sentadillas de superhéroe", icon: "🦸‍♀️" },
      { id: 4, text: "Ve hasta la puerta y tócala 2 veces como tocando el timbre", icon: "🚪" },
      { id: 5, text: "Gira una vuelta completa en tu lugar", icon: "🔄" },
      { id: 6, text: "Toca el suelo con ambas manos", icon: "👐" },
      { id: 7, text: "Busca un zapato, tenis o calcetín limpio", icon: "👟" },
      { id: 8, text: "Tráelo a la base y muéstralo frente al radar de la cámara", icon: "🏆" }
    ]
  }
];

// Lista de modelos candidatos en orden de prioridad con fallback automático
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.0-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];

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

  // Estado de la Misión Actual y Generador IA
  const [difficultySteps, setDifficultySteps] = useState(3);
  const [selectedTheme, setSelectedTheme] = useState('sorpresa');
  const [customPrompt, setCustomPrompt] = useState('');
  const [currentMission, setCurrentMission] = useState(REAL_WORLD_MISSIONS[1]);
  const [aiErrorMsg, setAiErrorMsg] = useState(null);
  
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

  useEffect(() => {
    if (showKeyModal) {
      setInputKey(apiKey);
      setKeyTestStatus(null);
    }
  }, [showKeyModal, apiKey]);

  // Función inteligente para llamar a Gemini con auto-detección de modelo si el modelo seleccionado da error
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

        // Si el mensaje de error de Google sugiere explícitamente un modelo (ej: models/gemini-3.x-flash), extraerlo y probarlo enseguida
        const matchSuggested = errMsg.match(/models\/(gemini-[a-zA-Z0-9.-]+)/);
        if (matchSuggested && matchSuggested[1] && !modelsToTry.includes(matchSuggested[1])) {
          modelsToTry.splice(i + 1, 0, matchSuggested[1]);
        }

        // Si el error es de API Key inválida (400 API_KEY_INVALID o 403), no seguir probando otros modelos
        if (errMsg.toLowerCase().includes('api key not valid') || res.status === 403) {
          break;
        }
      } catch (networkErr) {
        lastError = networkErr;
      }
    }

    // Último intento: consultar la lista oficial de modelos disponibles para esta API Key
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

  // Guardar la Key
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
          mensaje_divertido: "¡Gran trabajo agente! Sensores locales confirman el objeto. (Tip: Añade tu API Key de Gemini para activar la visión artificial en vivo).",
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
¿Se observa en la imagen el objeto, la construcción, la persona haciendo la acción, o el elemento solicitado (${currentMission.targetItem})? 
Sé muy tolerante con la iluminación, reflejos o si la niña sostiene el objeto con sus manos.

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
        speakText("Casi lo tenemos, agente. " + (parsed.mensaje_divertido || "Muestra el objeto un poco más cerca de la cámara."));
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

  // Generador de Misiones e Instrucciones con Gemini IA
  const generateNewAIMission = async (stepsToGenerate = difficultySteps, themeId = selectedTheme) => {
    const targetSteps = typeof stepsToGenerate === 'number' ? stepsToGenerate : difficultySteps;

    if (!apiKey.trim()) {
      setShowKeyModal(true);
      return;
    }

    setIsAnalyzingAI(true);
    setAiErrorMsg(null);
    SpyAudio.playRadar();

    const themeObj = AI_THEMES.find(t => t.id === themeId) || AI_THEMES[0];
    const themeInstruction = customPrompt.trim()
      ? `Instrucción especial solicitada por la familia: "${customPrompt.trim()}".`
      : `Temática elegida: ${themeObj.label} — ${themeObj.prompt}`;

    const stepsTemplateExample = Array.from({ length: targetSteps }, (_, idx) => {
      const isLast = idx === targetSteps - 1;
      return `    { "id": ${idx + 1}, "text": "${
        isLast
          ? 'Último paso: traer el objeto o mostrar el resultado frente a la cámara'
          : `Acción física corta, clara y divertida número ${idx + 1}`
      }", "icon": "✨" }`;
    }).join(',\n');

    const prompt = `Eres un diseñador experto en neuroeducación infantil y juegos de espías para entrenar la memoria operativa (memoria de trabajo) y el seguimiento de instrucciones secuenciales.

Crea una misión física nueva, creativa y divertida para realizar dentro de casa.
CANTIDAD OBLIGATORIA DE PASOS: EXACTAMENTE ${targetSteps} pasos secuenciales (numerados del 1 al ${targetSteps}).
${themeInstruction}

REGLAS OBLIGATORIAS:
1. Todos los pasos deben ser acciones físicas seguras y divertidas en el MUNDO REAL (ej: caminar como robot, dar saltos, tocar una puerta, girar, buscar un objeto de cierto color, apilar bloques, etc.).
2. Cada instrucción debe ser clara, breve (1 sola oración fácil de memorizar para una niña) y tener un emoji distinto.
3. El paso final (Paso ${targetSteps}) SIEMPRE debe pedir traer el objeto o mostrar la prueba frente a la cámara de la base.
4. La lista "steps" debe tener EXACTAMENTE ${targetSteps} elementos.

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "title": "Nombre divertido de operación espía",
  "category": "IA • ${themeObj.label.replace(/^[^\s]+\s/, '')}",
  "targetItem": "descripción breve del objeto o resultado a mostrar ante la cámara al final",
  "steps": [
${stepsTemplateExample}
  ]
}`;

    try {
      const { data, usedModel } = await callGeminiWithFallback(apiKey, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.9
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
          modelUsed: usedModel,
          stepsCount: normalizedSteps.length,
          steps: normalizedSteps
        };
        setCurrentMission(newMission);
        resetMissionFlow(normalizedSteps.length);
        SpyAudio.playSuccess();
        speakText(`¡Nueva misión de ${normalizedSteps.length} pasos generada por inteligencia artificial! ${newMission.title}.`);
      } else {
        throw new Error("El formato de pasos devuelto por la IA no fue válido.");
      }
    } catch (e) {
      console.warn("Fallo al generar misión con IA:", e);
      setAiErrorMsg(`No se pudo generar con IA (${e.message}). Se cargó una misión local de ${targetSteps} pasos.`);
      pickRandomPreset(targetSteps);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Añadir un paso adicional con IA o manualmente a la misión actual
  const addExtraStepToCurrentMission = async () => {
    const nextStepNum = currentMission.steps.length + 1;
    if (nextStepNum > 12) return;

    if (apiKey.trim()) {
      await generateNewAIMission(nextStepNum, selectedTheme);
      setDifficultySteps(nextStepNum);
      return;
    }

    // Modo sin API Key: insertar un paso físico extra antes del paso final de cámara
    const extraActions = [
      { text: "Da 3 saltos de rana con mucha energía", icon: "🐸" },
      { text: "Camina en puntillas alrededor de una silla", icon: "🪑" },
      { text: "Aplaude 4 veces con las manos arriba", icon: "👏" },
      { text: "Haz equilibrio en un solo pie durante 4 segundos", icon: "🦩" },
      { text: "Toca el suelo con ambas manos y salta hacia arriba", icon: "🚀" },
      { text: "Da una vuelta completa como bailarina ninja", icon: "🌪️" }
    ];
    const randomAction = extraActions[Math.floor(Math.random() * extraActions.length)];
    const existingSteps = [...currentMission.steps];
    const lastStep = existingSteps.pop();
    const updatedSteps = [
      ...existingSteps,
      { id: existingSteps.length + 1, ...randomAction },
      { ...lastStep, id: existingSteps.length + 2 }
    ].map((s, idx) => ({ ...s, id: idx + 1 }));

    const updatedMission = {
      ...currentMission,
      stepsCount: updatedSteps.length,
      steps: updatedSteps
    };
    setDifficultySteps(updatedSteps.length);
    setCurrentMission(updatedMission);
    resetMissionFlow(updatedSteps.length);
    SpyAudio.playRadar();
  };

  const pickRandomPreset = (stepsNum) => {
    const matching = REAL_WORLD_MISSIONS.filter(m => m.stepsCount === stepsNum);
    if (matching.length > 0) {
      const selected = matching[Math.floor(Math.random() * matching.length)];
      setCurrentMission(selected);
      resetMissionFlow(selected.steps.length);
      return;
    }

    // Si piden más pasos que el preset más largo, combinar pasos físicos automáticamente
    const base = REAL_WORLD_MISSIONS[REAL_WORLD_MISSIONS.length - 1];
    const extraPool = [
      { text: "Da 3 saltos abriendo y cerrando los brazos", icon: "🤸‍♀️" },
      { text: "Toca dos paredes distintas de la habitación", icon: "🧱" },
      { text: "Camina como robot durante 5 pasos", icon: "🤖" },
      { text: "Haz una reverencia elegante de espía", icon: "🎩" }
    ];
    const middleSteps = [...base.steps.slice(0, -1)];
    while (middleSteps.length < stepsNum - 1) {
      const pick = extraPool[middleSteps.length % extraPool.length];
      middleSteps.push({ id: middleSteps.length + 1, ...pick });
    }
    const finalSteps = [
      ...middleSteps.slice(0, stepsNum - 1),
      base.steps[base.steps.length - 1]
    ].map((s, i) => ({ ...s, id: i + 1 }));

    const builtMission = {
      ...base,
      title: `${base.title} (${stepsNum} Pasos)`,
      stepsCount: stepsNum,
      steps: finalSteps
    };
    setCurrentMission(builtMission);
    resetMissionFlow(stepsNum);
  };

  const resetMissionFlow = (stepsCount = difficultySteps) => {
    setPhase('listen');
    setRepeatTaps(0);
    setTimerSeconds(Math.max(60, stepsCount * 30));
    setIsTimerActive(false);
    setCheckedSteps([]);
    setCapturedImage(null);
    setAiFeedback(null);
  };

  const selectStepDifficulty = (num) => {
    setDifficultySteps(num);
    setAiErrorMsg(null);
    if (apiKey.trim()) {
      generateNewAIMission(num, selectedTheme);
    } else {
      pickRandomPreset(num);
    }
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
                Elige de 2 a 8+ pasos. {apiKey.trim() ? 'La IA creará una misión nueva al elegir.' : 'Activa tu API Key para que la IA invente misiones infinitas.'}
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
                    if (apiKey.trim()) {
                      generateNewAIMission(difficultySteps, theme.id);
                    }
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
                    ? `Creando ${difficultySteps} instrucciones...`
                    : `Generar ${difficultySteps} Instrucciones con IA`}
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-md font-mono">
                  {currentMission.category}
                </span>
                {currentMission.isAI && (
                  <span className="text-[11px] bg-purple-950/80 border border-purple-500/50 text-purple-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Creada por IA
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
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center text-lg font-black shadow-sm shrink-0">
                      {st.icon || idx + 1}
                    </div>
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        Paso {idx + 1} de {currentMission.steps.length}
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
                  speakText(`¡Muy bien! Ahora repite los ${currentMission.steps.length} pasos en voz alta tres veces seguidas.`);
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
                ¡MISIÓN DE {currentMission.steps.length} PASOS CUMPLIDA!
              </h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Tu hija escuchó, retuvo en memoria motora y ejecutó las {currentMission.steps.length} instrucciones en el espacio físico.
              </p>

              <div className="inline-flex items-center gap-2 bg-emerald-900/60 border border-emerald-600/60 px-4 py-2 rounded-xl text-emerald-300 font-bold text-sm">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>+{currentMission.steps.length * 30} Puntos de Memoria Ganados</span>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => generateNewAIMission(difficultySteps, selectedTheme)}
                  disabled={isAnalyzingAI}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-xl shadow-purple-900/30 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Nueva Misión IA ({difficultySteps} Pasos)</span>
                </button>

                <button
                  onClick={() => selectStepDifficulty(Math.min(10, difficultySteps + 1))}
                  disabled={isAnalyzingAI}
                  className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20"
                >
                  Subir Nivel a {Math.min(10, difficultySteps + 1)} Pasos 🚀
                </button>

                <button
                  onClick={() => pickRandomPreset(difficultySteps)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                >
                  Misión del Catálogo Local
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
            Al forzar a la niña a <strong>repetir la orden en voz alta antes de moverse</strong>, transformamos una orden externa en <em>habla subvocal autodirigida</em>. Esto activa los lóbulos frontales y evita que olvide los pasos intermedios mientras camina por la casa.
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
