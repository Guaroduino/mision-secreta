import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Volume2, Sparkles, CheckCircle2, RotateCcw, 
  Trophy, ShieldAlert, Award, Play, Eye, Flame, AlertCircle, 
  VolumeX, ArrowRight, UserCheck, RefreshCw, Zap, Check, Lock, Video,
  Key, Settings, ExternalLink, Trash2, CheckCircle, ShieldCheck, X,
  Plus, Wand2, Sliders, HelpCircle
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

// Temáticas con reglas estrictas para que TODOS los pasos y el objetivo obedezcan la temática elegida
const AI_THEMES = [
  {
    id: 'sorpresa',
    label: '🎲 Sorpresa Espía',
    prompt: 'Combina movimientos físicos divertidos por la habitación con buscar objetos cotidianos seguros de la casa.'
  },
  {
    id: 'dibujo',
    label: '✏️ Papel y Lápiz',
    prompt: 'TEMÁTICA ESTRICTA DE PAPEL, LÁPIZ Y DIBUJO: TODOS los pasos deben involucrar hojas de papel, cuaderno, lápices, colores o marcadores (por ejemplo: buscar papel y colores específicos, dibujar cierta cantidad de figuras geométricas, estrellas, flores, números o letras, doblar la hoja, encerrar en un círculo) y el último paso SIEMPRE debe ser mostrar el dibujo o la hoja terminada frente a la cámara.'
  },
  {
    id: 'lego',
    label: '🧱 LEGO y Bloques',
    prompt: 'TEMÁTICA ESTRICTA DE CONSTRUCCIÓN Y BLOQUES: TODOS los pasos deben girar en torno a buscar piezas de LEGO, bloques o fichas, clasificarlas por color o tamaño, armar torres, puentes o figuras con un número exacto de piezas, y mostrar la construcción terminada frente a la cámara.'
  },
  {
    id: 'ninja',
    label: '🥷 Agente Ninja',
    prompt: 'TEMÁTICA ESTRICTA DE ENTRENAMIENTO NINJA FÍSICO: Los pasos deben centrarse en desafíos motores de agilidad, saltos ninja, equilibrios en un pie, caminar en puntillas en sigilo, poses de estatua, sentadillas y desplazamientos rápidos, terminando con una pose o trayendo un objeto secreto a la cámara.'
  },
  {
    id: 'colores',
    label: '🎨 Cazadora de Colores',
    prompt: 'TEMÁTICA ESTRICTA DE COLORES: Cada paso debe exigir tocar, contar o recolectar objetos de colores muy específicos dentro de la habitación (ej: rojo, azul, amarillo, verde, morado) y mostrar los objetos del color pedido frente a la cámara.'
  },
  {
    id: 'peluches',
    label: '🧸 Peluches y Juguetes',
    prompt: 'TEMÁTICA ESTRICTA DE JUGUETES Y PELUCHES: Los pasos deben consistir en una misión de rescate y acciones divertidas usando peluches, muñecos o juguetes del cuarto y mostrarlos en la cámara al final.'
  }
];

// Modelos retirados o bloqueados para cuentas nuevas (NUNCA usarlos en la rotación)
const RETIRED_MODELS_BLACKLIST = new Set([
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-pro-vision'
]);

function isModelRetiredOrBlocked(modelId = '') {
  const clean = modelId.replace(/^models\//, '').toLowerCase();
  if (RETIRED_MODELS_BLACKLIST.has(clean)) return true;
  if (clean.startsWith('gemini-1.') || clean.startsWith('gemini-2.0')) return true;
  if (clean === 'gemini-2.5-flash' || clean.startsWith('gemini-2.5-flash-preview')) return true;
  if (
    clean.includes('embedding') ||
    clean.includes('imagen') ||
    clean.includes('veo') ||
    clean.includes('aqa') ||
    clean.includes('tts') ||
    clean.includes('audio') ||
    clean.includes('robotics') ||
    clean.includes('computer-use') ||
    clean.includes('learnlm')
  ) {
    return true;
  }
  return false;
}

// Orden de prioridad para maximizar la CUOTA GRATIS diaria en Google AI Studio:
// 1. Modelos Flash-Lite activos (suelen tener 500 a 1,500 RPD gratis separados de los 20 RPD de Flash estándar)
// 2. Modelos Gemma 3 27B / 12B activos (hasta 14,400 RPD gratis en Google AI Studio)
// 3. gemini-3.8-flash y otros modelos Gemini 3.x Flash activos (20 RPD cada uno)
function scoreModelForFreeQuota(modelId = '') {
  const clean = modelId.replace(/^models\//, '').toLowerCase();
  if (clean === 'gemini-3.8-flash-lite' || clean === 'gemini-3.8-flash-lite-preview') return 1000;
  if (clean.startsWith('gemini-3') && clean.includes('flash-lite')) return 950;
  if (clean === 'gemini-2.5-flash-lite') return 900;
  if (clean.includes('flash-lite')) return 850;
  if (clean === 'gemini-3.8-flash') return 800;
  if (clean.startsWith('gemini-3') && clean.includes('flash')) return 750;
  if (clean === 'gemma-3-27b-it') return 700;
  if (clean === 'gemma-3-12b-it') return 650;
  if (clean.startsWith('gemma-3')) return 600;
  if (clean.startsWith('gemini-3')) return 500;
  return 100;
}

const DEFAULT_FALLBACK_MODELS = [
  'gemini-3.8-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.1-flash-preview',
  'gemma-3-27b-it'
];

// Mezclar arreglo aleatoriamente
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Generador inteligente de 3 distractores MUY PARECIDOS a la instrucción correcta para que el test de memoria sea desafiante
function generateTrickyOptions(correctText = '', existingDistractors = []) {
  const cleanCorrect = String(correctText).trim();

  // Si la IA ya nos dio al menos 3 distractores distintos y válidos, usarlos
  const validFromAI = (Array.isArray(existingDistractors) ? existingDistractors : [])
    .map(d => String(d).trim())
    .filter(d => d && d.toLowerCase() !== cleanCorrect.toLowerCase());

  const uniqueDistractors = Array.from(new Set(validFromAI));

  // Grupos de palabras intercambiables para crear variaciones sutiles y engañosas
  const swapGroups = [
    ['rojo', 'azul', 'verde', 'amarillo', 'morado', 'naranja', 'rosado'],
    ['roja', 'azul', 'verde', 'amarilla', 'morada', 'rosada'],
    ['rojos', 'azules', 'verdes', 'amarillos', 'morados'],
    ['estrellas', 'círculos', 'triángulos', 'corazones', 'cuadrados', 'flores', 'soles'],
    ['estrella', 'círculo', 'triángulo', 'corazón', 'cuadrado', 'flor'],
    ['saltos', 'sentadillas', 'pasos gigantes', 'giros', 'brincos'],
    ['derecha', 'izquierda'],
    ['derecho', 'izquierdo'],
    ['arriba', 'abajo', 'al frente', 'atrás'],
    ['puerta', 'ventana', 'pared', 'mesa', 'silla'],
    ['codos', 'rodillas', 'hombros', 'talones', 'manos'],
    ['pingüino', 'robot', 'cangrejo', 'rana', 'dinosaurio', 'flamenco'],
    ['lápiz', 'marcador', 'crayón', 'bolígrafo', 'borrador'],
    ['hoja', 'libreta', 'cuaderno', 'cartulina'],
    ['peluche', 'cojín', 'muñeco', 'juguete', 'libro'],
    ['cuchara', 'vaso', 'plato', 'peine', 'zapato']
  ];

  // Función que altera números y/o palabras clave dentro de la oración para hacerla muy parecida pero incorrecta
  const createVariant = (variantIndex) => {
    let modified = cleanCorrect;
    let changedSomething = false;

    // 1. Alterar números si existen en el paso
    modified = modified.replace(/\b(\d+)\b/g, (match) => {
      const n = parseInt(match, 10);
      const offsets = [2, -1, 3, -2, 4, 1];
      const delta = offsets[(variantIndex + n) % offsets.length];
      const nextNum = Math.max(2, n + delta === n ? n + 2 : n + delta);
      changedSomething = true;
      return String(nextNum);
    });

    // 2. Intercambiar alguna palabra de los grupos semánticos
    for (const group of swapGroups) {
      for (let i = 0; i < group.length; i++) {
        const word = group[i];
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(modified)) {
          const replacement = group[(i + variantIndex + 1) % group.length];
          modified = modified.replace(regex, (found) => {
            changedSomething = true;
            // Preservar mayúscula inicial si la tenía
            if (found[0] === found[0].toUpperCase()) {
              return replacement.charAt(0).toUpperCase() + replacement.slice(1);
            }
            return replacement;
          });
          break;
        }
      }
    }

    // 3. Si la oración no tenía ni números ni palabras de la lista, agregar un detalle distractor plausible
    if (!changedSomething || modified.toLowerCase() === cleanCorrect.toLowerCase()) {
      const suffixes = [
        ' con los ojos cerrados dos segundos',
        ' mientras cuentas hasta cinco al revés',
        ' usando solamente la mano izquierda',
        ' dando dos palmadas antes de empezar',
        ' caminando hacia atrás despacio'
      ];
      modified = cleanCorrect.replace(/\.$/, '') + suffixes[variantIndex % suffixes.length];
    }

    return modified;
  };

  let attempt = 0;
  while (uniqueDistractors.length < 3 && attempt < 12) {
    const candidate = createVariant(attempt);
    if (
      candidate.toLowerCase() !== cleanCorrect.toLowerCase() &&
      !uniqueDistractors.some(d => d.toLowerCase() === candidate.toLowerCase())
    ) {
      uniqueDistractors.push(candidate);
    }
    attempt++;
  }

  // Garantizar siempre exactamente 4 opciones mezcladas
  const finalFour = [cleanCorrect, ...uniqueDistractors.slice(0, 3)];
  return shuffleArray(finalFour);
}

// Bancos procedurales por temática para cuando se juega sin conexión o como respaldo
function getProceduralDataByTheme(themeId = 'sorpresa', reps = 6) {
  const r = Math.max(2, Number(reps) || 6);
  const half = Math.max(2, Math.round(r * 0.6));

  if (themeId === 'dibujo') {
    return {
      category: `✏️ Papel y Lápiz (${r}x)`,
      actions: [
        { text: `Busca una hoja de papel o cuaderno y ponlo sobre la mesa`, icon: "📄" },
        { text: `Toma un lápiz o marcador y dibuja ${r} estrellas grandes en la hoja`, icon: "⭐" },
        { text: `Dibuja ${half} círculos y ${half} triángulos alrededor de la hoja`, icon: "🔺" },
        { text: `Escribe los números del 1 al ${r} en una esquina del papel`, icon: "🔢" },
        { text: `Dibuja una carita feliz gigante con ${r} rayos de sol alrededor`, icon: "☀️" },
        { text: `Traza ${r} líneas en zigzag de lado a lado de la hoja`, icon: "〰️" },
        { text: `Dibuja una torre de ${half} pisos con una bandera en la cima`, icon: "🏰" },
        { text: `Haz ${r} puntos de colores distintos dentro de un cuadro grande`, icon: "🎨" }
      ],
      targets: [
        { item: "tu hoja de papel con el dibujo terminado", stepText: "Sostén tu hoja con el dibujo frente a la cámara para escanearlo", icon: "✏️" },
        { item: "tu dibujo y el lápiz o color que usaste", stepText: "Muestra tu dibujo junto con tu lápiz o marcador frente a la cámara", icon: "🖍️" }
      ]
    };
  }

  if (themeId === 'lego') {
    return {
      category: `🧱 LEGO y Bloques (${r}x)`,
      actions: [
        { text: `Ve a tu zona de juguetes y reúne ${r} bloques o piezas de LEGO`, icon: "🧱" },
        { text: `Separa ${half} piezas de colores claros y ${half} de colores oscuros`, icon: "🎨" },
        { text: `Arma una torre vertical uniendo ${Math.min(10, r)} piezas seguidas`, icon: "🗼" },
        { text: `Camina con la construcción en las manos dando ${r} pasos de robot sin que se caiga`, icon: "🤖" },
        { text: `Coloca una pieza roja o azul en la parte más alta de tu construcción`, icon: "🔴" },
        { text: `Construye una escalera o puente usando al menos ${half} bloques`, icon: "🌉" }
      ],
      targets: [
        { item: "tu torre o figura armada con bloques/LEGO", stepText: "Coloca tu construcción de bloques frente a la cámara para validarla", icon: "🧱" }
      ]
    };
  }

  if (themeId === 'ninja') {
    return {
      category: `🥷 Agente Ninja (${r}x)`,
      actions: [
        { text: `Camina en sigilo ninja en puntillas durante ${r} pasos sin hacer ruido`, icon: "🥷" },
        { text: `Da ${r} saltos rápidos abriendo y cerrando los brazos`, icon: "⚡" },
        { text: `Haz equilibrio en un solo pie como grulla contando hasta ${r + 3}`, icon: "🦩" },
        { text: `Haz ${r} sentadillas ninja tocando el suelo con las puntas de los dedos`, icon: "🥋" },
        { text: `Esquiva láseres imaginarios agachándote ${half} veces seguidas`, icon: "レーザー" },
        { text: `Toca la pared derecha, luego la izquierda y da ${half} giros rápidos`, icon: "🌪️" }
      ],
      targets: [
        { item: "un cojín o cinta haciendo pose ninja", stepText: "Trae un cojín o juguete y haz tu mejor pose ninja frente a la cámara", icon: "🥷" }
      ]
    };
  }

  if (themeId === 'colores') {
    return {
      category: `🎨 Cazadora de Colores (${r}x)`,
      actions: [
        { text: `Busca y toca ${half} objetos de color azul en la habitación`, icon: "🔵" },
        { text: `Da ${r} palmadas frente a algo de color blanco o amarillo`, icon: "🟡" },
        { text: `Camina ${r} pasos gigantes hasta tocar algo de color rojo o rosado`, icon: "🔴" },
        { text: `Toca con el codo un objeto verde y da ${half} saltitos`, icon: "🟢" },
        { text: `Señala ${r} cosas de diferentes colores diciendo su color en voz alta`, icon: "🌈" }
      ],
      targets: [
        { item: "dos objetos de colores distintos (uno en cada mano)", stepText: "Trae 2 objetos de colores diferentes y muéstralos juntos en la cámara", icon: "🎨" },
        { item: "un objeto de color azul y uno rojo", stepText: "Muestra un objeto azul y uno rojo frente a la lente de la cámara", icon: "🌈" }
      ]
    };
  }

  if (themeId === 'peluches') {
    return {
      category: `🧸 Peluches y Juguetes (${r}x)`,
      actions: [
        { text: `Ve hasta donde están tus juguetes dando ${r} saltos de canguro`, icon: "🦘" },
        { text: `Elige un peluche o muñeco y dale ${half} vueltas en el aire con cuidado`, icon: "🧸" },
        { text: `Camina ${r} pasos llevando el peluche en equilibrio sobre tu cabeza o hombro`, icon: "🎪" },
        { text: `Siéntate en el suelo con tu juguete y levántate ${half} veces`, icon: "🚀" },
        { text: `Pon a bailar a tu peluche mientras das ${r} pasos de baile`, icon: "💃" }
      ],
      targets: [
        { item: "tu peluche o juguete rescatado", stepText: "Presenta a tu peluche o juguete frente a la cámara del Cuartel", icon: "🧸" }
      ]
    };
  }

  // Default: 'sorpresa'
  return {
    category: `🎲 Sorpresa Espía (${r}x)`,
    actions: [
      { text: `Camina como pingüino ${r} pasos seguidos hasta la puerta de la habitación`, icon: "🐧" },
      { text: `Da ${r} saltos altos abriendo los brazos como estrella`, icon: "⭐" },
      { text: `Toca el suelo con ambas manos y levántate de un salto ${half} veces`, icon: "🐸" },
      { text: `Gira ${half} vueltas sobre tus pies con cuidado como un trompo`, icon: "🌀" },
      { text: `Haz equilibrio en un solo pie mientras cuentas en voz alta hasta ${r + 3}`, icon: "🦩" },
      { text: `Aplaude ${r} veces por encima de tu cabeza y ${half} veces abajo`, icon: "👏" },
      { text: `Camina hacia atrás ${r} pasos como un cangrejo espía`, icon: "🦀" },
      { text: `Haz ${r} sentadillas de agente élite y saluda como comandante`, icon: "🫡" }
    ],
    targets: [
      { item: "un lápiz, color o marcador", stepText: "Busca un lápiz, color o marcador y muéstralo frente a la cámara", icon: "✏️" },
      { item: "un peluche o muñeco pequeño", stepText: "Rescata un peluche o juguete pequeño y tráelo a la cámara", icon: "🧸" },
      { item: "un libro o cuaderno", stepText: "Busca un libro, cuento o cuaderno y muéstralo en la cámara", icon: "📚" },
      { item: "un cojín o almohada pequeña", stepText: "Toma un cojín o almohada pequeña y enséñalo a la cámara", icon: "🛋️" },
      { item: "una cuchara pequeña o vaso de plástico seguro", stepText: "Busca una cuchara pequeña o vaso de plástico y muéstralo a la cámara", icon: "🥄" }
    ]
  };
}

// Generador procedural único respetando siempre la temática y creando 4 opciones por paso
function buildUniqueProceduralMission(stepsCount, previousTitles = [], actionReps = 6, themeId = 'sorpresa') {
  const themeData = getProceduralDataByTheme(themeId, actionReps);
  const shuffledActions = [...themeData.actions].sort(() => Math.random() - 0.5);
  const availableTargets = themeData.targets.filter(
    t => !previousTitles.some(prev => prev.includes(t.item))
  );
  const targetPool = availableTargets.length > 0 ? availableTargets : themeData.targets;
  const chosenTarget = targetPool[Math.floor(Math.random() * targetPool.length)];

  const actionStepsCount = Math.max(1, stepsCount - 1);
  const rawSteps = shuffledActions.slice(0, actionStepsCount).map((act, idx) => ({
    id: idx + 1,
    text: act.text,
    icon: act.icon
  }));

  rawSteps.push({
    id: actionStepsCount + 1,
    text: chosenTarget.stepText,
    icon: chosenTarget.icon
  });

  const stepsWithQuiz = rawSteps.map((s) => ({
    ...s,
    options: generateTrickyOptions(s.text)
  }));

  const codeNumber = Math.floor(100 + Math.random() * 900);
  return {
    stepsCount: stepsWithQuiz.length,
    actionReps,
    category: themeData.category,
    title: `Operación #${codeNumber}: ${chosenTarget.icon}`,
    targetItem: chosenTarget.item,
    steps: stepsWithQuiz
  };
}

// Generador procedural de misión de recolección y orden de los objetos usados
function buildProceduralCleanupMission(objectsToClean = []) {
  const uniqueObjects = Array.from(new Set(objectsToClean.filter(Boolean)));
  const itemsList = uniqueObjects.length > 0
    ? uniqueObjects
    : ['los objetos que usaste en las misiones anteriores'];

  const cleanupSteps = itemsList.map((obj, idx) => {
    const text = `Toma ${obj} y devuélvelo ordenadamente a su lugar original en la casa`;
    return {
      id: idx + 1,
      text,
      icon: "🧹",
      options: generateTrickyOptions(text, [
        `Deja ${obj} debajo de la mesa de la sala`,
        `Esconde ${obj} detrás de la puerta del cuarto`,
        `Cambia ${obj} por otro juguete nuevo sin guardarlo`
      ])
    };
  });

  const lastText = "Da un salto de victoria y muestra tus dos manos libres con el pulgar arriba frente a la cámara";
  cleanupSteps.push({
    id: cleanupSteps.length + 1,
    text: lastText,
    icon: "👍",
    options: generateTrickyOptions(lastText)
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
// Tiempo mínimo obligatorio de lectura y memorización antes de pasar al Test de Memoria (80 segundos)
const MIN_STUDY_SECONDS = 80;

export default function App() {
  // Manejo de Gemini API Key y Rotación Inteligente Multi-Modelo de Alta Cuota Gratis
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || "";
    }
    return "";
  });
  const [preferredModelMode, setPreferredModelMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gemini_model_mode');
      if (saved && !isModelRetiredOrBlocked(saved)) return saved;
    }
    return 'auto';
  });
  const [activeModel, setActiveModel] = useState('gemini-3.8-flash-lite');
  const [availableModels, setAvailableModels] = useState(DEFAULT_FALLBACK_MODELS);
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
  const [actionReps, setActionReps] = useState(8);
  const [selectedTheme, setSelectedTheme] = useState('sorpresa');
  const [customPrompt, setCustomPrompt] = useState('');
  const [missionHistory, setMissionHistory] = useState([]);
  const [currentMission, setCurrentMission] = useState(() =>
    buildUniqueProceduralMission(3, [], 8, 'sorpresa')
  );
  const [aiErrorMsg, setAiErrorMsg] = useState(null);
  const [queuedMissionsCount, setQueuedMissionsCount] = useState(0);
  
  // Flujo del protocolo: 'listen' -> 'repeat' (quiz de 4 opciones por paso) -> 'action' -> 'verify' -> 'success'
  const [phase, setPhase] = useState('listen');
  const [quizStepIndex, setQuizStepIndex] = useState(0); // Índice del paso que está recordando (0 a steps.length - 1)
  const [wrongOptionSelected, setWrongOptionSelected] = useState(null);
  const [quizFeedbackMsg, setQuizFeedbackMsg] = useState("");
  const [peekInstructions, setPeekInstructions] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState(90);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [studySecondsLeft, setStudySecondsLeft] = useState(MIN_STUDY_SECONDS);
  const [checkedSteps, setCheckedSteps] = useState([]);

  // Cámara e IA Gemini
  const [cameraActive, setCameraActive] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [isGeneratingMission, setIsGeneratingMission] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Referencias DOM y Cachés de Modelos / Cola de Misiones IA (3x misiones por llamada)
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const didInitialAIFetch = useRef(false);
  const discoveredModelsCacheRef = useRef({ key: '', models: [] });
  const retiredModelsRef = useRef(new Set(RETIRED_MODELS_BLACKLIST));
  const quotaExhaustedModelsRef = useRef(new Map()); // modelId -> timestamp
  const aiMissionQueueRef = useRef([]); // [{ keySignature, mission }]

  useEffect(() => {
    if (showKeyModal) {
      setInputKey(apiKey);
      setKeyTestStatus(null);
      if (apiKey.trim()) {
        discoverActiveModels(apiKey.trim());
      }
    }
  }, [showKeyModal, apiKey]);

  // Descubre dinámicamente los modelos activos de la cuenta consultando /v1beta/models (0 costo de cuota)
  const discoverActiveModels = async (rawKey) => {
    const cleanKey = rawKey.trim();
    if (!cleanKey) return DEFAULT_FALLBACK_MODELS;
    if (
      discoveredModelsCacheRef.current.key === cleanKey &&
      discoveredModelsCacheRef.current.models.length > 0
    ) {
      return discoveredModelsCacheRef.current.models;
    }

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`
      );
      if (!res.ok) return DEFAULT_FALLBACK_MODELS;
      const data = await res.json();
      const rawList = Array.isArray(data.models) ? data.models : [];

      const activeIds = rawList
        .filter(m => {
          const methods = m.supportedGenerationMethods || [];
          return methods.includes('generateContent');
        })
        .map(m => String(m.name || '').replace(/^models\//, ''))
        .filter(id => id && !isModelRetiredOrBlocked(id) && !retiredModelsRef.current.has(id));

      // Combinar con nuestra lista curada de alta cuota y ordenar por mayor cuota gratuita
      const combined = Array.from(new Set([...activeIds, ...DEFAULT_FALLBACK_MODELS]))
        .filter(id => !isModelRetiredOrBlocked(id) && !retiredModelsRef.current.has(id))
        .sort((a, b) => scoreModelForFreeQuota(b) - scoreModelForFreeQuota(a));

      if (combined.length > 0) {
        discoveredModelsCacheRef.current = { key: cleanKey, models: combined };
        setAvailableModels(combined);
        return combined;
      }
    } catch (e) {
      console.warn("No se pudo listar /v1beta/models, usando lista activa por defecto:", e);
    }
    return DEFAULT_FALLBACK_MODELS;
  };

  // Rotación inteligente entre modelos activos con alta cuota gratuita (Flash-Lite -> 3.8-Flash -> Gemma-3-27B)
  // Si un modelo agota sus 20 peticiones diarias (429 / quota), salta automáticamente al siguiente modelo activo con cuota disponible.
  const callGeminiWithFallback = async (key, payload, overrideMode = preferredModelMode) => {
    const cleanKey = key.trim();
    const discovered = await discoverActiveModels(cleanKey);

    // Determinar si el payload incluye imagen (visión multimodal)
    const hasInlineImage = JSON.stringify(payload).includes('"inlineData"');

    // Construir orden de candidatos activos
    let candidates = [...discovered];
    if (overrideMode && overrideMode !== 'auto' && !isModelRetiredOrBlocked(overrideMode)) {
      candidates = [overrideMode, ...candidates.filter(m => m !== overrideMode)];
    }

    // Filtrar modelos retirados y poner al final los que hayan dado 429 en los últimos 10 minutos
    const now = Date.now();
    const freshCandidates = [];
    const recentlyExhausted = [];

    for (const modelId of candidates) {
      if (isModelRetiredOrBlocked(modelId) || retiredModelsRef.current.has(modelId)) continue;
      const exhaustedAt = quotaExhaustedModelsRef.current.get(modelId);
      if (exhaustedAt && now - exhaustedAt < 10 * 60 * 1000) {
        recentlyExhausted.push(modelId);
      } else {
        freshCandidates.push(modelId);
      }
    }

    const finalOrder = [...freshCandidates, ...recentlyExhausted];
    const errorsSummary = [];

    for (const modelId of finalOrder) {
      const isGemmaModel = modelId.toLowerCase().startsWith('gemma-');
      // Ajustar payload si es un modelo Gemma (Gemma no admite responseMimeType: application/json)
      const adaptedPayload = isGemmaModel && payload.generationConfig?.responseMimeType
        ? {
            ...payload,
            generationConfig: {
              ...payload.generationConfig,
              responseMimeType: undefined
            }
          }
        : payload;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${cleanKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adaptedPayload)
        });

        if (res.ok) {
          const data = await res.json();
          setActiveModel(modelId);
          return { data, usedModel: modelId };
        }

        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `Error HTTP ${res.status}`;
        const lowerMsg = errMsg.toLowerCase();

        // Si la API Key en sí es inválida, detener inmediatamente
        if (lowerMsg.includes('api_key_invalid') || lowerMsg.includes('api key not valid')) {
          throw new Error('La API Key ingresada no es válida. Verifica que esté bien copiada de Google AI Studio.');
        }

        // Si el modelo está retirado o no existe (404 / no longer available), ponerlo en lista negra permanente y probar el siguiente
        if (
          res.status === 404 ||
          lowerMsg.includes('no longer available') ||
          lowerMsg.includes('not found') ||
          lowerMsg.includes('not supported') ||
          (hasInlineImage && isGemmaModel)
        ) {
          retiredModelsRef.current.add(modelId);
          continue;
        }

        // Si el modelo alcanzó su límite de cuota gratuita (ej. 20 RPD en gemini-3.8-flash), marcarlo y saltar al siguiente modelo activo (ej. flash-lite o gemma-3-27b-it)
        if (
          res.status === 429 ||
          lowerMsg.includes('quota') ||
          lowerMsg.includes('rate limit') ||
          lowerMsg.includes('resource_exhausted') ||
          lowerMsg.includes('exceeded')
        ) {
          quotaExhaustedModelsRef.current.set(modelId, Date.now());
          errorsSummary.push(`${modelId}: cuota agotada`);
          continue;
        }

        // Si falló por responseMimeType en algún modelo preview, reintentar sin responseMimeType
        if (res.status === 400 && adaptedPayload.generationConfig?.responseMimeType) {
          const retryPayload = {
            ...adaptedPayload,
            generationConfig: {
              ...adaptedPayload.generationConfig,
              responseMimeType: undefined
            }
          };
          const retryRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(retryPayload)
          });
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            setActiveModel(modelId);
            return { data: retryData, usedModel: modelId };
          }
        }

        errorsSummary.push(`${modelId}: ${errMsg}`);
      } catch (networkOrAuthErr) {
        if (networkOrAuthErr.message.includes('API Key ingresada no es válida')) {
          throw networkOrAuthErr;
        }
        errorsSummary.push(`${modelId}: ${networkOrAuthErr.message}`);
      }
    }

    throw new Error(
      errorsSummary.length > 0
        ? `Se probó rotación en ${finalOrder.length} modelos activos (${errorsSummary.slice(0, 2).join(' | ')})`
        : 'No se encontró un modelo con cuota disponible en este momento.'
    );
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

  // Probar la API Key y descubrir todos los modelos con cuota libre
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
      const modelsFound = await discoverActiveModels(key);
      const { usedModel } = await callGeminiWithFallback(
        key,
        { contents: [{ parts: [{ text: "Responde únicamente: 'CONEXION_EXITOSA'" }] }] },
        preferredModelMode
      );

      setKeyTestStatus({
        success: true,
        message: `¡Conectado! Modelo activo con cuota disponible: ${usedModel} (${modelsFound.length} modelos activos detectados para rotación).`
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

  // Guardar la Key y generar lote de misiones con IA inmediatamente
  const handleSaveKey = () => {
    const cleanKey = inputKey.trim();
    setApiKey(cleanKey);
    if (saveToStorage) {
      localStorage.setItem('gemini_api_key', cleanKey);
      localStorage.setItem('gemini_model_mode', preferredModelMode);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setShowKeyModal(false);
    SpyAudio.playSuccess();
    if (cleanKey) {
      generateNewAIMission(difficultySteps, selectedTheme, cleanKey, actionReps, true);
    }
  };

  // Eliminar la Key
  const handleClearKey = () => {
    setApiKey("");
    setInputKey("");
    localStorage.removeItem('gemini_api_key');
    aiMissionQueueRef.current = [];
    setQueuedMissionsCount(0);
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
    const speech = `¡Atenta Agente! Misión "${missionToRead.title}" de ${missionToRead.steps.length} pasos. ${stepsSpoken}. Memorízalos bien para superar el reto de memoria.`;
    speakText(speech);
  };

  // ================== SELECCIÓN SIMPLE DE 4 OPCIONES POR PASO (FASE 2) ==================
  const handleSelectQuizOption = (selectedText) => {
    const currentStepObj = currentMission.steps[quizStepIndex];
    if (!currentStepObj) return;

    if (selectedText.trim().toLowerCase() === currentStepObj.text.trim().toLowerCase()) {
      // ¡Respuesta correcta!
      setWrongOptionSelected(null);
      const nextStepIdx = quizStepIndex + 1;
      SpyAudio.playBeep(520 + nextStepIdx * 90, 'sine', 0.14);

      if (nextStepIdx >= currentMission.steps.length) {
        // Completó todos los pasos del test de memoria
        setQuizStepIndex(nextStepIdx);
        setQuizFeedbackMsg("¡Excelente! Recordaste todos los pasos en el orden exacto.");
        setTimeout(() => {
          setPhase('action');
          setIsTimerActive(true);
          SpyAudio.playSuccess();
          speakText("¡Memoria verificada al cien por ciento! Ahora corre a cumplir la misión en la casa.");
        }, 500);
      } else {
        setQuizStepIndex(nextStepIdx);
        setQuizFeedbackMsg(`✅ ¡Paso ${quizStepIndex + 1} correcto! Ahora selecciona cuál era el Paso ${nextStepIdx + 1}.`);
      }
    } else {
      // Respuesta incorrecta (trampa/distractor)
      SpyAudio.playAlarm();
      setWrongOptionSelected(selectedText);
      setQuizFeedbackMsg("❌ ¡Casi! Esa opción tiene un detalle cambiado. Recuerda bien el número, color o acción exacta.");
    }
  };

  useEffect(() => {
    setPeekInstructions(false);
    setWrongOptionSelected(null);
    setQuizFeedbackMsg("");
    if (phase === 'repeat') {
      setQuizStepIndex(0);
    }
  }, [phase]);

  // Temporizador de lectura mínima obligatoria (80s) en Fase 1 ('listen')
  useEffect(() => {
    if (phase !== 'listen' || isGeneratingMission || studySecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setStudySecondsLeft(prev => {
        if (prev <= 1) {
          SpyAudio.playRadar();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, isGeneratingMission, studySecondsLeft]);

  // Temporizador de cuenta regresiva de ejecución (Fase 3)
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
¿Se observa en la imagen el dibujo, el objeto, la construcción, la persona haciendo la señal/acción, o el elemento solicitado (${currentMission.targetItem})? 
Sé muy tolerante con la iluminación, reflejos o si la niña sostiene el dibujo u objeto con sus manos.

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
      setUsedObjects([]);
      setStepsSinceCleanup(0);
      speakText(cheerMessage || "¡Cuartel General impecable! Guardaste todos los objetos secretos en su lugar y ganaste un bono extra.");
    } else {
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
- La niña deba recoger cada uno de esos objetos (${itemsToClean.join(', ')}) y llevarlos de vuelta a su lugar correcto en la casa de forma divertida.
- El último paso (Paso ${totalCleanupSteps}) SIEMPRE debe ser regresar a la cámara y mostrar sus dos manos vacías con los pulgares arriba 👍 para demostrar que ya guardó todo.
- Para cada paso incluye también "distractors": un arreglo con 3 opciones falsas pero muy parecidas al texto del paso (cambiando un número, lugar u objeto) para el test de memoria.

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura:
{
  "title": "Operación Cuartel Impecable: Guardar Evidencias",
  "category": "🧹 Misión Especial de Orden",
  "targetItem": "tus dos manos libres con los pulgares arriba 👍 tras guardar todos los objetos",
  "steps": [
    {
      "id": 1,
      "text": "Paso 1 para recoger y guardar el primer objeto en su sitio",
      "icon": "🧹",
      "distractors": [
        "Opción falsa muy parecida 1",
        "Opción falsa muy parecida 2",
        "Opción falsa muy parecida 3"
      ]
    }
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
        const normalizedSteps = missionJson.steps.map((s, idx) => {
          const stepText = s.text || `Guarda el objeto ${idx + 1} en su sitio`;
          return {
            id: idx + 1,
            text: stepText,
            icon: s.icon || "🧹",
            options: generateTrickyOptions(stepText, s.distractors)
          };
        });
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
      await generateNewAIMission(targetSteps, themeId, apiKey, actionReps);
    }
  };

  // Normaliza un objeto de misión crudo devuelto por la IA
  const normalizeAIMissionObject = (rawMission, usedModel, targetReps, themeObj) => {
    if (!rawMission || !Array.isArray(rawMission.steps) || rawMission.steps.length === 0) {
      return null;
    }
    const normalizedSteps = rawMission.steps.map((s, idx) => {
      const stepText = s.text || `Paso secreto ${idx + 1}`;
      return {
        id: idx + 1,
        text: stepText,
        icon: s.icon || "🕵️‍♀️",
        options: generateTrickyOptions(stepText, s.distractors)
      };
    });
    return {
      title: rawMission.title || `Operación ${themeObj.label.replace(/^[^\s]+\s/, '')}`,
      category: rawMission.category || `IA • ${themeObj.label.replace(/^[^\s]+\s/, '')} (${targetReps}x)`,
      targetItem: rawMission.targetItem || `tu resultado de ${themeObj.label}`,
      isAI: true,
      isCleanupMission: false,
      actionReps: targetReps,
      modelUsed: usedModel,
      stepsCount: normalizedSteps.length,
      steps: normalizedSteps
    };
  };

  // Generador de Misiones e Instrucciones con Gemini IA
  // AHORRO 3X DE CUOTA: Genera un paquete de 3 misiones distintas en 1 sola llamada API y guarda 2 en reserva instantánea.
  const generateNewAIMission = async (
    stepsToGenerate = difficultySteps,
    themeId = selectedTheme,
    overrideKey = apiKey,
    repsToUse = actionReps,
    forceFreshBatch = false
  ) => {
    const targetSteps = typeof stepsToGenerate === 'number' ? stepsToGenerate : difficultySteps;
    const targetReps = typeof repsToUse === 'number' ? repsToUse : actionReps;
    const activeThemeId = typeof themeId === 'string' ? themeId : selectedTheme;
    const activeKeyToUse = (typeof overrideKey === 'string' ? overrideKey : apiKey).trim();
    const themeObj = AI_THEMES.find(t => t.id === activeThemeId) || AI_THEMES[0];
    const keySignature = `${targetSteps}_${targetReps}_${activeThemeId}_${customPrompt.trim().toLowerCase()}`;

    if (!activeKeyToUse) {
      const procMission = buildUniqueProceduralMission(targetSteps, missionHistory, targetReps, activeThemeId);
      setMissionHistory(prev => [...prev.slice(-15), `${procMission.title} (${procMission.targetItem})`]);
      setCurrentMission(procMission);
      resetMissionFlow(procMission.steps.length, targetReps);
      SpyAudio.playSuccess();
      return;
    }

    // 1. Verificar si ya tenemos una misión IA lista en la cola de reserva para esta misma configuración (0 gasto de cuota)
    if (!forceFreshBatch) {
      const matchIndex = aiMissionQueueRef.current.findIndex(item => item.keySignature === keySignature);
      if (matchIndex !== -1) {
        const [picked] = aiMissionQueueRef.current.splice(matchIndex, 1);
        setQueuedMissionsCount(aiMissionQueueRef.current.length);
        const cachedMission = picked.mission;
        setMissionHistory(prev => [
          ...prev.slice(-15),
          `${cachedMission.title} -> objeto: ${cachedMission.targetItem} -> pasos: ${cachedMission.steps.map(s => s.text).join('; ')}`
        ]);
        setCurrentMission(cachedMission);
        resetMissionFlow(cachedMission.steps.length, targetReps);
        SpyAudio.playSuccess();
        speakText(`¡Nueva misión lista de ${themeObj.label.replace(/^[^\s]+\s/, '')} con ${cachedMission.steps.length} pasos! ${cachedMission.title}.`);
        return;
      }
    }

    setIsAnalyzingAI(true);
    setIsGeneratingMission(true);
    setPhase('listen');
    setAiErrorMsg(null);
    SpyAudio.playRadar();

    const randomSeedId = Math.floor(10000 + Math.random() * 90000);

    const recentHistoryList = [
      `${currentMission.title} -> objeto: ${currentMission.targetItem} -> pasos: ${currentMission.steps.map(s => s.text).join('; ')}`,
      ...missionHistory.slice(-10)
    ].join('\n- ');

    const customUserRequest = customPrompt.trim()
      ? `\nPETICIÓN ADICIONAL ESPECÍFICA DE LA FAMILIA (OBLIGATORIO INCLUIRLA): "${customPrompt.trim()}".`
      : '';

    const stepsTemplateExample = Array.from({ length: targetSteps }, (_, idx) => {
      const isLast = idx === targetSteps - 1;
      return `        {
          "id": ${idx + 1},
          "text": "${
            isLast
              ? `Paso final (${targetSteps}): mostrar ante la cámara el resultado u objeto de la temática ${themeObj.label}`
              : `Paso ${idx + 1} cumpliendo estrictamente la temática ${themeObj.label} con intensidad/cantidad ~${targetReps}`
          }",
          "icon": "✨",
          "distractors": [
            "Opción trampa 1 MUY parecida al paso ${idx + 1} pero cambiando el número o el color",
            "Opción trampa 2 MUY parecida al paso ${idx + 1} pero cambiando la figura, objeto o dirección",
            "Opción trampa 3 MUY parecida al paso ${idx + 1} pero cambiando un detalle clave de la acción"
          ]
        }`;
    }).join(',\n');

    const prompt = `Eres un diseñador experto en neuroeducación infantil y juegos de espías para entrenar la memoria operativa (memoria de trabajo) y el seguimiento de instrucciones secuenciales.

Lote de Misiones Únicas: #${randomSeedId}
CANTIDAD OBLIGATORIA DE PASOS POR MISIÓN: EXACTAMENTE ${targetSteps} pasos secuenciales (numerados del 1 al ${targetSteps}).
INTENSIDAD / CANTIDADES DENTRO DE CADA PASO: ~${targetReps} repeticiones o elementos (por ejemplo: dibujar ${targetReps} figuras, dar ${targetReps} saltos, usar ${targetReps} bloques, contar hasta ${targetReps + 3}, etc.).

===================================================================
TEMÁTICA OBLIGATORIA SELECCIONADA POR EL USUARIO: ${themeObj.label}
REGLA DE TEMÁTICA: ${themeObj.prompt}${customUserRequest}
¡IMPORTANTE!: TODOS los pasos de cada misión y el objeto final DEBEN tratar directamente sobre esta temática (${themeObj.label}). No inventes pasos de otra temática distinta.
===================================================================

HISTORIAL DE MISIONES YA JUGADAS (PROHIBIDO REPETIR ESTOS MISMOS PASOS O DIBUJOS/OBJETOS EXACTOS):
- ${recentHistoryList}

REGLAS PARA LAS OPCIONES DE SELECCIÓN MÚLTIPLE ("distractors"):
Para cada paso debes incluir un array "distractors" con EXACTAMENTE 3 opciones falsas que sean MUY PARECIDAS al texto verdadero ("text") de ese paso, cambiando sutilmente números (ej. ${targetReps} por ${targetReps + 2} o ${Math.max(2, targetReps - 2)}), colores, formas o partes del cuerpo, para que el niño tenga que recordar con precisión cuál era la instrucción verdadera.

Para optimizar la cuota de la API, genera UN PAQUETE DE 3 MISIONES COMPLETAMENTE DIFERENTES ENTRE SÍ dentro del array "missions".
Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "missions": [
    {
      "title": "Nombre creativo de operación espía #1 acorde a ${themeObj.label}",
      "category": "IA • ${themeObj.label.replace(/^[^\s]+\s/, '')} (${targetReps}x)",
      "targetItem": "descripción breve de lo que debe mostrar ante la cámara al final acorde a ${themeObj.label}",
      "steps": [
${stepsTemplateExample}
      ]
    }
  ]
}`;

    try {
      const { data, usedModel } = await callGeminiWithFallback(activeKeyToUse, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.95
        }
      });

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsedJson = parseCleanJson(rawText);

      // Soportar tanto { missions: [...] } como un objeto único { title, steps: [...] }
      const rawMissionsList = Array.isArray(parsedJson?.missions)
        ? parsedJson.missions
        : Array.isArray(parsedJson)
        ? parsedJson
        : parsedJson?.steps
        ? [parsedJson]
        : [];

      const validMissions = rawMissionsList
        .map(m => normalizeAIMissionObject(m, usedModel, targetReps, themeObj))
        .filter(Boolean);

      if (validMissions.length > 0) {
        const [firstMission, ...extraMissions] = validMissions;

        // Guardar las misiones extra (2 misiones adicionales gratis) en la cola de reserva
        if (extraMissions.length > 0) {
          const queueEntries = extraMissions.map(m => ({ keySignature, mission: m }));
          aiMissionQueueRef.current = [...queueEntries, ...aiMissionQueueRef.current].slice(0, 12);
          setQueuedMissionsCount(aiMissionQueueRef.current.length);
        }

        setMissionHistory(prev => [
          ...prev.slice(-15),
          `${firstMission.title} -> objeto: ${firstMission.targetItem} -> pasos: ${firstMission.steps.map(s => s.text).join('; ')}`
        ]);
        setCurrentMission(firstMission);
        resetMissionFlow(firstMission.steps.length, targetReps);
        SpyAudio.playSuccess();
        speakText(`¡Nueva misión de ${themeObj.label.replace(/^[^\s]+\s/, '')} con ${firstMission.steps.length} pasos! ${firstMission.title}.`);
      } else {
        throw new Error("El formato de pasos devuelto por la IA no fue válido.");
      }
    } catch (e) {
      console.warn("Fallo al generar misión con IA:", e);
      setAiErrorMsg(`Aviso IA (${e.message}). Se generó una misión dinámica de ${themeObj.label}.`);
      const procMission = buildUniqueProceduralMission(targetSteps, missionHistory, targetReps, activeThemeId);
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
      generateNewAIMission(difficultySteps, selectedTheme, apiKey, actionReps);
    }
  }, []);

  // Añadir un paso adicional con IA o dinámicamente a la misión actual
  const addExtraStepToCurrentMission = async () => {
    const nextStepNum = currentMission.steps.length + 1;
    if (nextStepNum > 12) return;
    setDifficultySteps(nextStepNum);
    await generateNewAIMission(nextStepNum, selectedTheme, apiKey, actionReps);
  };

  const resetMissionFlow = (stepsCount = difficultySteps, repsCount = actionReps) => {
    setPhase('listen');
    setStudySecondsLeft(MIN_STUDY_SECONDS);
    setQuizStepIndex(0);
    setWrongOptionSelected(null);
    setQuizFeedbackMsg("");
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

  const activeQuizStep = currentMission.steps[quizStepIndex] || currentMission.steps[0];

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
                Define si cada paso pide acciones cortas (ej: 3x) o largas (ej: {actionReps} dibujos/saltos/bloques).
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
                Temática Obligatoria:
              </span>
              {AI_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setSelectedTheme(theme.id);
                    generateNewAIMission(difficultySteps, theme.id, apiKey, actionReps);
                  }}
                  disabled={isAnalyzingAI}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                    selectedTheme === theme.id
                      ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-900/50 scale-105'
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
                  if (e.key === 'Enter') generateNewAIMission(difficultySteps, selectedTheme, apiKey, actionReps);
                }}
                placeholder="Opcional: escribe qué quieres en la misión (ej: 'dibujar una casa y un árbol', 'con cojines en la sala')..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500"
              />

              <button
                onClick={() => generateNewAIMission(difficultySteps, selectedTheme, apiKey, actionReps)}
                disabled={isAnalyzingAI}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all shrink-0"
              >
                <Sparkles className={`w-4 h-4 ${isAnalyzingAI ? 'animate-spin' : ''}`} />
                <span>
                  {isAnalyzingAI
                    ? `Inventando lote de misiones (${difficultySteps} Pasos)...`
                    : `Inventar Nueva Misión (${difficultySteps} Pasos)`}
                </span>
              </button>
            </div>

            {apiKey.trim() && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                <span>
                  🔄 Modo Alta Cuota Gratis activo: <strong className="text-emerald-400">{activeModel}</strong> (1 llamada = 3 misiones)
                </span>
                {queuedMissionsCount > 0 && (
                  <span className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                    ⚡ {queuedMissionsCount} {queuedMissionsCount === 1 ? 'misión IA lista en reserva' : 'misiones IA listas en reserva'} (0 gasto de cuota)
                  </span>
                )}
              </div>
            )}

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
            <span>2. Test Memoria</span>
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
                  Inventando nueva misión de {difficultySteps} pasos ({AI_THEMES.find(t => t.id === selectedTheme)?.label})...
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Preparando pasos personalizados y las 4 opciones trampa para el test de memoria.
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
                    onClick={() => generateNewAIMission(difficultySteps, selectedTheme, apiKey, actionReps)}
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
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Modo Memoria Activa: Los pasos por adivinar están borrosos para no leerlos</span>
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
                  const isAlreadyRemembered = phase === 'repeat' && idx < quizStepIndex;
                  const isCurrentQuizTarget = phase === 'repeat' && idx === quizStepIndex;
                  // Se mantiene borroso durante la Fase 2 hasta que la niña adivine ese paso (o si activan Ver Pista)
                  const isBlurredForMemory = phase === 'repeat' && !peekInstructions && !isAlreadyRemembered;

                  return (
                    <div
                      key={st.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        isAlreadyRemembered
                          ? 'bg-emerald-950/30 border-emerald-500/60 shadow-md'
                          : isCurrentQuizTarget
                          ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/20'
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
                          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex flex-wrap items-center gap-2">
                            <span>Paso {idx + 1} de {currentMission.steps.length}</span>
                            {isAlreadyRemembered && (
                              <span className="text-[10px] bg-emerald-400 text-slate-950 px-2 py-0.2 rounded-full font-black">
                                ✅ ¡Recordado con éxito!
                              </span>
                            )}
                            {isCurrentQuizTarget && (
                              <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full font-black animate-pulse">
                                👇 ¿Cuál era este paso? Elige abajo
                              </span>
                            )}
                          </div>
                          <div className={`text-base font-bold text-white transition-all duration-300 ${
                            isBlurredForMemory ? 'blur-md select-none opacity-60' : ''
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

              {/* ================= FASE 1: ESCUCHAR (CON TIEMPO MÍNIMO DE 80s PARA MEMORIZAR) ================= */}
              {phase === 'listen' && (
                <div className="p-5 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left space-y-1">
                      <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>Paso 1: Lee y memoriza con calma los {currentMission.steps.length} pasos</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        {studySecondsLeft > 0
                          ? `Lee varias veces los números, colores y detalles. El test de memoria se desbloqueará en ${studySecondsLeft} segundos.`
                          : '¡Tiempo de estudio completado! Ya puedes ocultar las instrucciones y hacer el test de memoria.'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto shrink-0">
                      <button
                        disabled={studySecondsLeft > 0}
                        onClick={() => {
                          SpyAudio.playSuccess();
                          setPhase('repeat');
                          speakText(`¡Hora del reto de memoria! Selecciona cuál era el Paso 1 entre las cuatro opciones.`);
                        }}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                          studySecondsLeft > 0
                            ? 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 animate-bounce'
                        }`}
                      >
                        {studySecondsLeft > 0 ? (
                          <>
                            <Lock className="w-4 h-4 text-amber-400" />
                            <span>Memorizando... ({studySecondsLeft}s)</span>
                          </>
                        ) : (
                          <>
                            <span>¡Listo! Ocultar y Hacer Test</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {studySecondsLeft > 0 && (
                        <button
                          onClick={() => setStudySecondsLeft(0)}
                          className="text-[10px] text-slate-500 hover:text-cyan-400 underline font-mono"
                        >
                          Saltar espera (Padres)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Barra de progreso visual de los 80 segundos de lectura */}
                  {studySecondsLeft > 0 && (
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(100, Math.round(((MIN_STUDY_SECONDS - studySecondsLeft) / MIN_STUDY_SECONDS) * 100))}%`
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ================= FASE 2: VERIFICACIÓN POR SELECCIÓN SIMPLE (4 OPCIONES PARECIDAS POR PASO) ================= */}
              {phase === 'repeat' && activeQuizStep && (
                <div className="p-5 sm:p-6 rounded-3xl bg-amber-950/25 border-2 border-amber-500/50 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow">
                        {Math.min(quizStepIndex + 1, currentMission.steps.length)}/{currentMission.steps.length}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm sm:text-base font-black text-amber-300 flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4" />
                          <span>¿Cuál era exactamente el PASO {Math.min(quizStepIndex + 1, currentMission.steps.length)}?</span>
                        </h4>
                        <p className="text-xs text-amber-200/80">
                          Cuidado con las opciones trampa: lee o escucha las 4 opciones y selecciona la verdadera.
                        </p>
                      </div>
                    </div>

                    {/* Indicador de pasos completados en el quiz */}
                    <div className="flex items-center gap-1.5">
                      {currentMission.steps.map((s, idx) => (
                        <div
                          key={s.id}
                          className={`h-2.5 w-7 rounded-full transition-all ${
                            idx < quizStepIndex
                              ? 'bg-emerald-400'
                              : idx === quizStepIndex
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Cuadrícula de 4 Opciones Parecidas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(activeQuizStep.options || generateTrickyOptions(activeQuizStep.text)).map((optionText, optIdx) => {
                      const letters = ['A', 'B', 'C', 'D'];
                      const isWrongClicked = wrongOptionSelected === optionText;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectQuizOption(optionText)}
                          className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 group ${
                            isWrongClicked
                              ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                              : 'bg-slate-950/90 hover:bg-slate-900 border-slate-700 hover:border-amber-400 text-slate-100 shadow-md'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-lg font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isWrongClicked
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-800 group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-300'
                          }`}>
                            {letters[optIdx] || optIdx + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-bold leading-snug">
                            {optionText}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mensaje de retroalimentación del Quiz */}
                  {quizFeedbackMsg && (
                    <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
                      wrongOptionSelected
                        ? 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                        : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                    }`}>
                      <span>{quizFeedbackMsg}</span>
                    </div>
                  )}
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
                          Centra aquí el dibujo, objeto o señal solicitada
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
                      : `Tu hija memorizó con precisión los detalles y ejecutó las ${currentMission.steps.length} instrucciones en el mundo real.`}
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
            Al ocultar las instrucciones y presentar <strong>4 opciones muy parecidas por paso</strong> (con números, colores o acciones sutilmente cambiadas), el cerebro debe discriminar los detalles exactos en la memoria operativa antes de pasar a la acción física.
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

            {/* Selector de Estrategia de Modelos Activos (Alta Cuota Gratis) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold uppercase tracking-wider">Modelo / Estrategia de Cuota Gratis:</span>
                <span className="text-emerald-400 font-bold">Activo: {activeModel}</span>
              </div>
              <select
                value={preferredModelMode}
                onChange={(e) => setPreferredModelMode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-mono text-white"
              >
                <option value="auto">
                  🔄 Automático: Rotación Alta Cuota Gratis (Flash-Lite 500+/día + 3.8 Flash + Gemma 3 14,400/día)
                </option>
                {availableModels.map(m => (
                  <option key={m} value={m}>
                    {m.includes('flash-lite')
                      ? `⚡ ${m} (Alta Cuota Gratis ~500-1,500/día)`
                      : m.startsWith('gemma-3')
                      ? `🚀 ${m} (Cuota Gratis Masiva ~14,400/día)`
                      : `✨ ${m} (Cuota Estándar ~20/día)`}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                💡 Si <code className="text-amber-300">gemini-3.8-flash</code> llega al límite de 20 peticiones diarias, el modo automático salta al instante a <code className="text-emerald-300">flash-lite</code> o <code className="text-cyan-300">gemma-3-27b-it</code> que tienen cientos o miles de peticiones gratis al día.
              </p>
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
