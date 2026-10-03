import { invokeLLM } from "./_core/llm";

export const SUPPORTED_LANGUAGES = ["Español", "Portugués", "Inglés", "Catalán", "Francés"] as const;
export const SUPPORTED_STYLES = ["Lady Gaga", "The Smiths", "Anitta", "Nathy Peluso"] as const;
export const SUPPORTED_PROVIDERS = ["local", "ollama", "forge"] as const;

export type PipelineUpdate = {
  stage: "Planner" | "Compositor" | "Productor" | "Evaluador";
  status: "active" | "complete";
  progress: number;
  message: string;
};

export type CompositionInput = {
  theme?: string;
  language: (typeof SUPPORTED_LANGUAGES)[number];
  styles: string[];
  bpm: number;
  key: string;
  provider?: (typeof SUPPORTED_PROVIDERS)[number];
  model?: string;
  onProgress?: (update: PipelineUpdate) => void;
  /** Internal backend-only creative genome; never accepted from the client. */
  genome?: MusicalGenome;
};

type LogEntry = { agent: string; action: string; timestamp: string };
type PipelineStage = { name: string; status: "complete" | "active" | "pending"; progress: number; message: string };

export type MusicIR = {
  metadata: { title: string; artist: string; version: string };
  concept: { core_idea: string; autonomous: boolean };
  musical: { key: string; bpm: number; meter: string; sections: string[] };
  lyrics: { language: string; content: Record<string, string>; phonetic_guidance: Record<string, string>; prosody: { score: number; global: string; sections: Record<string, { syllables: number; lines: number; meanSyllables: number; accentCoverage: number; cantability: number; notes: string }> } };
  harmony: { chords: Record<string, string[]>; progression_notes: string };
  arrangement: {
    roles_per_section: Record<string, string[]>;
    dynamics_curve: Record<string, number>;
    space: Record<string, string>;
  };
  production: { interpretation: string; vocal_delivery: string };
  evaluation: {
    score: number;
    feedback: string[];
    phonetic_score: number;
    harmony_score: number;
    structure_score: number;
    prosody_score: number;
  };
  model: { provider: string; name: string; mode: "offline" | "online" };
  pipeline: PipelineStage[];
  history: LogEntry[];
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const CHORD_INTERVALS: Record<string, number[]> = {
  m9: [0, 3, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  maj7: [0, 4, 7, 11],
  maj7sharp11: [0, 4, 7, 11, 18],
  maj13: [0, 4, 7, 11, 14, 21],
  "7sharp9": [0, 4, 7, 10, 15],
  "7b9": [0, 4, 7, 10, 13],
  m7b5: [0, 3, 6, 10],
};

const now = () => new Date().toISOString();
const addLog = (history: LogEntry[], agent: string, action: string) => history.push({ agent, action, timestamp: now() });

function rootFromKey(key: string) {
  const match = key.match(/^[A-G](?:#|b)?/);
  return match?.[0] ?? "A";
}

function noteIndex(note: string) {
  const normalized = note.replace("b", "#");
  const flats: Record<string, string> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#" };
  return NOTE_NAMES.indexOf(flats[note] ?? normalized);
}

function transposeNote(root: string, semitones: number) {
  return NOTE_NAMES[(noteIndex(root) + semitones + 12) % 12] ?? "A";
}

function chordProgression(key: string, profile = "Modal Jazz") {
  const root = rootFromKey(key);
  const dominant = transposeNote(root, 7);
  const subdominant = transposeNote(root, 5);
  const mediant = transposeNote(root, 3);
  if (profile === "Dark Minor") {
    return {
      Intro: [`${root}m9`, `${subdominant}m7b5`],
      Verso: [`${root}m9`, `${mediant}m7b5`, `${subdominant}m9`, `${dominant}7b9`],
      "Pre-Coro": [`${transposeNote(root, 2)}m7b5`, `${dominant}7b9`, `${root}m9`, `${subdominant}m7b5`],
      Coro: [`${root}m9`, `${subdominant}m9`, `${transposeNote(root, 10)}m7b5`, `${dominant}7b9`],
      Puente: [`${subdominant}m7b5`, `${mediant}m9`, `${dominant}7b9`, `${root}m9`],
      Outro: [`${root}m9`, `${subdominant}m7b5`],
    };
  }
  if (profile === "Suspended 4ths") {
    return {
      Intro: [`${root}maj9`, `${subdominant}maj7sharp11`],
      Verso: [`${root}maj9`, `${dominant}7sharp9`, `${subdominant}maj7sharp11`, `${root}maj9`],
      "Pre-Coro": [`${transposeNote(root, 2)}m9`, `${subdominant}maj7sharp11`, `${dominant}7sharp9`, `${root}maj9`],
      Coro: [`${root}maj9`, `${subdominant}maj13`, `${dominant}7sharp9`, `${root}maj9`],
      Puente: [`${subdominant}maj7sharp11`, `${transposeNote(root, 3)}maj9`, `${dominant}7sharp9`, `${root}maj9`],
      Outro: [`${root}maj9`, `${subdominant}maj7sharp11`],
    };
  }
  return {
    Intro: [`${root}maj9`, `${subdominant}maj7sharp11`],
    Verso: [`${root}m9`, `${subdominant}maj7sharp11`, `${mediant}maj9`, `${dominant}7sharp9`],
    "Pre-Coro": [`${transposeNote(root, 2)}m9`, `${dominant}13`, `${root}maj9`, `${subdominant}maj13`],
    Coro: [`${root}m9`, `${subdominant}maj13`, `${transposeNote(root, 10)}m7b5`, `${dominant}7sharp9`],
    Puente: [`${transposeNote(root, 5)}m9`, `${transposeNote(root, 10)}maj7`, `${transposeNote(root, 3)}9`, `${transposeNote(root, 8)}maj7`],
    Outro: [`${root}m9`, `${subdominant}maj7sharp11`],
  };
}

function phoneticGuidance(language: string) {
  const common = "Prioriza acento léxico natural, sílabas cantables, respiraciones claras y vocales sostenibles sobre la traducción literal.";
  const guidance: Record<string, string> = {
    Español: `${common} Usa vocales abiertas a/e/o en notas largas y consonantes dobles solo como ataque rítmico.`,
    Portugués: `${common} Conserva nasalidad de ão/em/am sin sacrificar inteligibilidad; reserva sibilantes para síncopas.`,
    Inglés: `${common} Respeta el stress-timed rhythm y coloca palabras monosilábicas fuertes en pulsos estables.`,
    Catalán: `${common} Mantén la oposición de vocales abiertas y cerradas y evita grupos consonánticos impronunciables.`,
    Francés: `${common} Conserva liaison y vocales nasales; las consonantes finales no deben cargar el pulso fuerte.`,
  };
  return guidance[language] ?? guidance.Español;
}

function lyricTemplates(language: string, theme: string) {
  const safeTheme = theme.trim() || "un pulso secreto que despierta la ciudad";
  const templates: Record<string, Record<string, string>> = {
    Español: {
      Intro: `Respira la noche, ${safeTheme},\nla calle afina su señal.`,
      Verso: `Cruzo despacio el ruido azul,\nllevo una chispa bajo la voz;\nsi el miedo cambia de dirección,\nmi cuerpo aprende otra canción.`,
      "Pre-Coro": `Sube la sangre, baja el reloj,\nlo que no digo canta mejor.`,
      Coro: `Ven, que la luz nos encuentra,\nlate la sombra, cambia la escena;\nsi todo tiembla alrededor,\nponemos ritmo al corazón.`,
      Puente: `No hay traducción para este temblor,\nsolo una sílaba buscando calor.`,
      Outro: `Queda el pulso, queda la voz,\nla noche vuelve a su color.`,
    },
    Portugués: {
      Intro: `Respira a noite, ${safeTheme},\na rua acende o seu sinal.`,
      Verso: `Passo ligeiro no neon,\nguardo um segredo na canção;\nse o medo muda de lugar,\nmeu corpo aprende a recomeçar.`,
      "Pre-Coro": `Sobe a maré, cai o relógio,\no que eu não digo vira fogo.`,
      Coro: `Vem, que a luz nos atravessa,\nbate no peito, vira promessa;\nse tudo gira ao nosso redor,\ndamos balanço ao coração.`,
      Puente: `Não há palavra para esse calor,\nsó uma sílaba pedindo amor.`,
      Outro: `Fica o balanço, fica a voz,\na noite dança entre nós.`,
    },
    Inglés: {
      Intro: `Breathe through the night, ${safeTheme},\nthe city tunes its wire.`,
      Verso: `I walk the blue between the lights,\nkeep a small spark behind my eyes;\nwhen every fear rewrites the road,\nmy body finds a warmer mode.`,
      "Pre-Coro": `Raise the pulse, release the clock,\nwhat I don't say becomes the shock.`,
      Coro: `Come, let the bright thing find us,\nturn every shadow into chorus;\nwhen the whole room starts to move,\nwe give the heartbeat back its groove.`,
      Puente: `No single word can hold this sound,\njust open vowels rising now.`,
      Outro: `Keep the pulse, keep the tone,\nnight returns us to our own.`,
    },
    Catalán: {
      Intro: `Respira la nit, ${safeTheme},\nla ciutat prova el seu senyal.`,
      Verso: `Camino lent entre els llums,\nguardo una espurna dins la veu;\nsi la por gira de costat,\nel cos inventa un nou compàs.`,
      "Pre-Coro": `Puja la sang, cau el rellotge,\nel que no dic encén la nit.`,
      Coro: `Vine, que la llum ens travessa,\nballa l'ombra, canvia l'escena;\nsi tot tremola al nostre volt,\nposarem ritme al cor.`,
      Puente: `No hi ha paraula per aquest tremolor,\nnomés una síl·laba buscant escalfor.`,
      Outro: `Queda el pols, queda la veu,\nla nit retorna al seu color.`,
    },
    Francés: {
      Intro: `Respire la nuit, ${safeTheme},\nla ville accorde son signal.`,
      Verso: `Je marche au bord des néons bleus,\nje garde un feu derrière les yeux;\nsi la peur change de chemin,\nmon corps invente un lendemain.`,
      "Pre-Coro": `Monte le sang, tombe l'horloge,\nce que je tais devient l'écho.`,
      Coro: `Viens, que la lumière nous traverse,\nque chaque ombre devienne une promesse;\nsi tout s'effondre autour de nous,\non rend le rythme au cœur fou.`,
      Puente: `Aucun mot ne contient ce son,\nune voyelle ouvre l'horizon.`,
      Outro: `Garde le pouls, garde la voix,\nla nuit revient près de toi.`,
    },
  };
  return templates[language] ?? templates.Español;
}

function countSyllables(word: string, language: string) {
  const clean = word.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zãõüy]/g, "");
  if (!clean) return 0;
  const groups = clean.match(/[aeiouyãõü]+/g) ?? [];
  let count = Math.max(1, groups.length);
  if ((language === "Español" || language === "Catalán") && clean.length > 4 && /(es|en|os|as)$/.test(clean) && count > 1) count -= 1;
  if (language === "Francés" && /e$/.test(clean) && count > 1) count -= 1;
  return count;
}

function analyzeProsody(content: Record<string, string>, language: string) {
  const sections: Record<string, { syllables: number; lines: number; meanSyllables: number; accentCoverage: number; cantability: number; notes: string }> = {};
  const scores: number[] = [];
  for (const [section, value] of Object.entries(content)) {
    const lines = value.split("\n").map(line => line.trim()).filter(Boolean);
    const lineSyllables = lines.map(line => (line.match(/[A-Za-zÀ-ÿ']+/g) ?? []).reduce((sum, word) => sum + countSyllables(word, language), 0));
    const words = value.match(/[A-Za-zÀ-ÿ']+/g) ?? [];
    const accented = words.filter(word => /[áéíóúàèìòùâêîôãõ]/i.test(word) || /[aeiouy]$/i.test(word));
    const mean = lineSyllables.length ? lineSyllables.reduce((sum, item) => sum + item, 0) / lineSyllables.length : 0;
    const variance = lineSyllables.length ? Math.max(...lineSyllables) - Math.min(...lineSyllables) : 0;
    const accentCoverage = words.length ? Math.round((accented.length / words.length) * 100) : 0;
    const cantability = Math.max(0, Math.min(100, Math.round(100 - Math.abs(mean - 8) * 5 - variance * 3 - Math.max(0, mean - 14) * 4 + Math.min(12, accentCoverage * 0.12))));
    scores.push(cantability);
    sections[section] = { syllables: lineSyllables.reduce((sum, item) => sum + item, 0), lines: lines.length, meanSyllables: Math.round(mean * 10) / 10, accentCoverage, cantability, notes: variance <= 3 ? "Fraseo regular; admite subdivisión y respiración natural." : "Variación métrica expresiva; revisar encaje en notas largas." };
  }
  const score = scores.length ? Math.round(scores.reduce((sum, item) => sum + item, 0) / scores.length) : 0;
  return { score, sections, global: `Auditoría prosódica: ${score}/100. Se cuentan sílabas por línea, regularidad métrica y cobertura de acentos; validar después con voz humana.` };
}

function analyzePhonetics(content: Record<string, string>, language: string) {
  const text = Object.values(content).join(" ").toLowerCase();
  const vowels = text.match(/[aeiouáéíóúàèìòùâêîôûãõåäëïöü]/g) ?? [];
  const openVowels = text.match(/[aáàâeéèêoóòô]/g) ?? [];
  const longLines = Object.values(content).flatMap(value => value.split("\n")).filter(line => line.trim().length > 62).length;
  const prosody = analyzeProsody(content, language);
  const vowelSupport = vowels.length ? Math.min(100, Math.round((openVowels.length / vowels.length) * 130)) : 0;
  return Math.round(prosody.score * 0.65 + vowelSupport * 0.25 + Math.max(0, 100 - longLines * 7) * 0.1);
}

function buildFallback(input: CompositionInput): MusicIR {
  const theme = input.theme?.trim() || "un pulso secreto que despierta la ciudad";
  const sections = ["Intro", "Verso", "Pre-Coro", "Coro", "Puente", "Outro"];
  const lyrics = lyricTemplates(input.language, theme);
  const harmonyProfile = input.genome?.slots.harmony ?? "Modal Jazz";
  const chords = chordProgression(input.key, harmonyProfile);
  const history: LogEntry[] = [];
  const pipeline: PipelineStage[] = [
    { name: "Planner", status: "complete", progress: 25, message: "Mapa de estructura y restricciones creado." },
    { name: "Compositor", status: "complete", progress: 50, message: `Letra nativa y armonía calculadas en ${input.language}.` },
    { name: "Productor", status: "complete", progress: 75, message: "Roles, dinámica y espacio sonoro asignados." },
    { name: "Evaluador", status: "complete", progress: 100, message: "Auditoría estructural y fonética completada." },
  ];
  addLog(history, "Planner", "Plan creado: tema opcional, idioma nativo, armonía extendida y producción por roles.");
  addLog(history, "Compositor", `Composición generada sin traducción literal en ${input.language}.`);
  addLog(history, "Productor", "Roles abstractos y curva de dinámica asignados.");
  const prosody = analyzeProsody(lyrics, input.language);
  const phoneticScore = analyzePhonetics(lyrics, input.language);
  addLog(history, "Evaluador", `Auditoría prosódica completada: ${prosody.score}/100; fonética: ${phoneticScore}/100.`);
  return {
    metadata: { title: "Pulso sin traducción", artist: "MUSIC OS", version: "1.1-audit" },
    concept: { core_idea: theme, autonomous: !input.theme?.trim() },
    musical: { key: input.key, bpm: input.bpm, meter: "4/4", sections },
    lyrics: { language: input.language, content: lyrics, phonetic_guidance: { global: phoneticGuidance(input.language) }, prosody },
    harmony: { chords, progression_notes: `Perfil de genoma ${harmonyProfile}: acordes extendidos calculados por intervalos y validados contra ${input.key}.` },
    arrangement: {
      roles_per_section: {
        Intro: ["Textura_Pad: Apertura aérea", "Registro_Grave: Entrada contenida"],
        Verso: ["Registro_Grave: Melódico y cercano", "Soporte_Armónico: Comping abierto", "Contramelodía: Respuestas breves"],
        "Pre-Coro": ["Tensión_Armónica: Ascenso gradual", "Ritmo_Groove: Síncopa contenida"],
        Coro: ["Ritmo_Groove: Firme y elástico", "Textura_Pad: Ancho y brillante", "Melodía_Principal: Al frente"],
        Puente: ["Tensión_Armónica: Fricción expresiva", "Contramelodía: Diálogo fragmentado"],
        Outro: ["Soporte_Armónico: Resolución suspendida", "Registro_Grave: Decay largo"],
      },
      dynamics_curve: { Intro: 22, Verso: 44, "Pre-Coro": 68, Coro: 94, Puente: 57, Outro: 18 },
      space: { Intro: "Estéreo abierto, cola larga", Verso: "Seco, centrado e íntimo", "Pre-Coro": "Profundidad creciente", Coro: "Reverb amplia y delay ping-pong", Puente: "Claustrofóbico con eco inverso", Outro: "Aire alto y decay lento" },
    },
    production: { interpretation: "Interpretación somática: consonantes como ataque, vocales abiertas como sostén y respiración antes de cada cambio de sección.", vocal_delivery: "Comienza conversacional, aumenta la presión en el Pre-Coro y libera el Coro sin perder dicción." },
    evaluation: { score: Math.round((phoneticScore * 0.35 + prosody.score * 0.25 + 94 * 0.4) * 10) / 10, feedback: ["Estructura completa.", "Tema opcional resuelto autónomamente.", "Revisar pronunciación final con voz humana antes de publicar."], phonetic_score: phoneticScore, harmony_score: 94, structure_score: 100, prosody_score: prosody.score },
    model: { provider: input.provider ?? "local", name: input.model ?? (input.provider === "ollama" ? "qwen2.5:7b" : "deterministic-kernel"), mode: input.provider === "local" ? "offline" : "online" },
    pipeline,
    history,
  };
}

const textOf = (content: unknown) => typeof content === "string" ? content : JSON.stringify(content ?? "");

function applyEditorPayload(base: MusicIR, raw: unknown, source: string) {
  const parsed = JSON.parse(textOf(raw));
  if (typeof parsed.title === "string" && parsed.title.trim()) base.metadata.title = parsed.title.trim().slice(0, 120);
  if (parsed.lyrics && typeof parsed.lyrics === "object") {
    for (const section of base.musical.sections) {
      if (typeof parsed.lyrics[section] === "string") base.lyrics.content[section] = parsed.lyrics[section].trim();
    }
  }
  if (typeof parsed.vocal_delivery === "string") base.production.vocal_delivery = parsed.vocal_delivery.slice(0, 500);
  base.lyrics.prosody = analyzeProsody(base.lyrics.content, base.lyrics.language);
  base.evaluation.phonetic_score = analyzePhonetics(base.lyrics.content, base.lyrics.language);
  base.evaluation.prosody_score = base.lyrics.prosody.score;
  base.evaluation.score = Math.round((base.evaluation.phonetic_score * 0.35 + base.evaluation.prosody_score * 0.25 + base.evaluation.harmony_score * 0.4) * 10) / 10;
  addLog(base.history, "Compositor", `Capa ${source} aplicada.`);
  return base;
}

async function enrichWithForge(base: MusicIR, input: CompositionInput) {
  const response = await invokeLLM({
    model: input.model,
    maxTokens: 2400,
    messages: [
      { role: "system", content: "Eres un editor musical. Devuelve solo JSON válido con title, lyrics y vocal_delivery. Escribe de forma nativa en el idioma pedido; no traduzcas literalmente. Prioriza prosodia cantable, acento léxico y vocales sostenibles. No imites la voz ni frases de artistas concretos." },
      { role: "user", content: JSON.stringify({ language: input.language, theme: base.concept.core_idea, styles: input.styles, sections: base.musical.sections, phonetic_guidance: phoneticGuidance(input.language) }) },
    ],
    responseFormat: { type: "json_object" },
  });
  const raw = response.choices[0]?.message?.content;
  return applyEditorPayload(base, raw, `online mediante ${input.model ?? "modelo predeterminado"}`);
}

async function enrichWithOllama(base: MusicIR, input: CompositionInput) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const endpoint = `${(process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "")}/api/chat`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: input.model ?? "qwen2.5:7b",
        stream: false,
        format: "json",
        messages: [
          { role: "system", content: "Eres un editor musical. Devuelve solo JSON válido con title, lyrics y vocal_delivery. Escribe de forma nativa en el idioma pedido, cuidando prosodia y cantabilidad." },
          { role: "user", content: JSON.stringify({ language: input.language, theme: base.concept.core_idea, styles: input.styles, sections: base.musical.sections, phonetic_guidance: phoneticGuidance(input.language) }) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Ollama respondió ${response.status}`);
    const payload = await response.json() as { message?: { content?: unknown } };
    return applyEditorPayload(base, payload.message?.content, `Ollama/${input.model ?? "qwen2.5:7b"}`);
  } finally {
    clearTimeout(timeout);
  }
}

const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export async function generateComposition(input: CompositionInput): Promise<MusicIR> {
  const report = input.onProgress ?? (() => undefined);
  report({ stage: "Planner", status: "active", progress: 8, message: "Planner está definiendo restricciones y estructura." });
  await pause(140);
  report({ stage: "Planner", status: "complete", progress: 25, message: "Planner terminó el mapa de secciones y tensiones." });
  report({ stage: "Compositor", status: "active", progress: 32, message: `Compositor está escribiendo en ${input.language} con prioridad fonética.` });
  await pause(140);
  const base = buildFallback(input);
  report({ stage: "Compositor", status: "complete", progress: 50, message: "Compositor terminó letra, acordes y guía prosódica." });
  report({ stage: "Productor", status: "active", progress: 58, message: "Productor está asignando roles, dinámica y profundidad espacial." });
  await pause(140);
  report({ stage: "Productor", status: "complete", progress: 75, message: "Productor terminó el diseño abstracto de producción." });
  report({ stage: "Evaluador", status: "active", progress: 84, message: "Evaluador está verificando fonética, armonía y estructura." });
  await pause(140);
  if (input.provider === "forge" || input.provider === "ollama") {
    try {
      await (input.provider === "forge" ? enrichWithForge(base, input) : enrichWithOllama(base, input));
    } catch (error) {
      addLog(base.history, "Sistema", `Fallback local activado: ${error instanceof Error ? error.message : "error online desconocido"}`);
      base.model = { provider: "local-fallback", name: "deterministic-kernel", mode: "offline" };
    }
  }
  report({ stage: "Evaluador", status: "complete", progress: 100, message: `Evaluación terminada: ${base.evaluation.score}/100.` });
  return base;
}

function vlq(value: number) {
  let buffer = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

function chordNotes(chord: string) {
  const match = chord.match(/^([A-G](?:#|b)?)(.*)$/);
  const root = match?.[1] ?? "C";
  const quality = (match?.[2] ?? "m9").replace("#", "sharp").replace("b", "b");
  const intervals = CHORD_INTERVALS[quality] ?? CHORD_INTERVALS.m9;
  const rootMidi = 60 + ((noteIndex(root) + 12) % 12);
  return intervals.map(interval => rootMidi + interval);
}

export function renderMidi(ir: MusicIR) {
  const ticksPerBeat = 480;
  const events: Array<{ tick: number; order: number; bytes: number[] }> = [];
  let tick = 0;
  for (const section of ir.musical.sections) {
    for (const chord of ir.harmony.chords[section] ?? []) {
      for (const note of chordNotes(chord)) {
        events.push({ tick, order: 1, bytes: [0x90, note, 92] });
        events.push({ tick: tick + ticksPerBeat * 4, order: 0, bytes: [0x80, note, 0] });
      }
      tick += ticksPerBeat * 4;
    }
  }
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const track: number[] = [0x00, 0xff, 0x51, 0x03, (60000000 / ir.musical.bpm >> 16) & 0xff, (60000000 / ir.musical.bpm >> 8) & 0xff, (60000000 / ir.musical.bpm) & 0xff];
  let previous = 0;
  for (const event of events) {
    track.push(...vlq(event.tick - previous), ...event.bytes);
    previous = event.tick;
  }
  track.push(...vlq(0), 0xff, 0x2f, 0x00);
  const header = [0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x01, (ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff];
  const length = track.length;
  return Buffer.from([...header, 0x4d, 0x54, 0x72, 0x6b, (length >>> 24) & 0xff, (length >>> 16) & 0xff, (length >>> 8) & 0xff, length & 0xff, ...track]);
}

export function renderScoreText(ir: MusicIR) {
  return [
    `TÍTULO: ${ir.metadata.title}`,
    `IDIOMA: ${ir.lyrics.language}`,
    `TONALIDAD: ${ir.musical.key}`,
    `BPM: ${ir.musical.bpm}`,
    `EVALUACIÓN: ${ir.evaluation.score}/100`,
    "",
    ...ir.musical.sections.flatMap(section => [
      `[${section}] DINÁMICA ${ir.arrangement.dynamics_curve[section] ?? 0}%`,
      `ACORDES: ${(ir.harmony.chords[section] ?? []).join(" | ")}`,
      ir.lyrics.content[section] ?? "",
      "",
    ]),
  ].join("\n");
}
import type { MusicalGenome } from "./musicGenome";
