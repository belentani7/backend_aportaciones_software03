import crypto from "node:crypto";

export interface MusicalGenome {
  id: string;
  base: string; // Tonalidad / escala base
  slots: {
    style: string;      // e.g. "Ambient", "Cyberpunk", "Lo-Fi", "Orchestral"
    rhythm: string;     // e.g. "Syncopated", "Four-on-the-floor", "Poly-rhythm"
    harmony: string;    // e.g. "Modal Jazz", "Dark Minor", "Suspended 4ths"
    instrumentation: string; // e.g. "Analog Synth & Rhodes", "Strings & 808"
    mood: string;       // e.g. "Melancholic", "Triumphant", "Hypnotic"
    era: string;        // e.g. "Retro-Futuristic 2084", "Classical Baroque"
  };
  negative: string;
  cfg: number;
  steps: number;
  loraWeights: Record<string, number>;
  seed: number;
  fitness: number;
  lineage: string[];
  qaScore?: number;
  noveltyScore?: number;
}

const SLOT_CATEGORIES = ["style", "rhythm", "harmony", "instrumentation", "mood", "era"] as const;

const HARMONY_BY_KEY: Record<string, string[]> = {
  Am: ["Dark Minor", "Modal Jazz", "Suspended 4ths"],
  C: ["Modal Jazz", "Suspended 4ths"],
  Dm: ["Dark Minor", "Modal Jazz"],
  Em: ["Dark Minor", "Modal Jazz"],
  F: ["Suspended 4ths", "Modal Jazz"],
  G: ["Modal Jazz", "Suspended 4ths"],
  Bm: ["Dark Minor", "Modal Jazz"],
};

export function isHarmonicallyCompatible(base: string, harmony: string) {
  return (HARMONY_BY_KEY[base] ?? ["Modal Jazz", "Dark Minor", "Suspended 4ths"]).includes(harmony);
}

function compatibleHarmony(base: string, candidates: string[]) {
  const valid = candidates.filter(candidate => isHarmonicallyCompatible(base, candidate));
  const pool = valid.length ? valid : (HARMONY_BY_KEY[base] ?? ["Modal Jazz"]);
  return pool[Math.floor(Math.random() * pool.length)];
}

const SYNONYM_MAP: Record<string, string[]> = {
  "Ambient": ["Atmospheric", "Ethereal", "Immersive", "Sonic Soundscape"],
  "Cyberpunk": ["Neon-Noir", "Industrial Synth", "Dystopian Pulse", "Digital Underground"],
  "Lo-Fi": ["Warm Vinyl", "Tape-Saturnated", "Dusty Groove", "Mellow Chill"],
  "Orchestral": ["Symphonic", "Cinematic Strings", "Grand Acoustic", "Epic Ensemble"],
  "Syncopated": ["Broken Beat", "Off-beat Groove", "Complex Rhythm", "Groove-driven"],
  "Four-on-the-floor": ["Driving Pulse", "Steady Beat", "Club Thump", "Motorik Pulse"],
  "Modal Jazz": ["Improvisational", "Cool Bop", "Extended Chords", "Expressive Blues"],
  "Dark Minor": ["Moody Minor", "Gothic Tension", "Shadowy Intervals", "Minor Noir"],
  "Melancholic": ["Nostalgic", "Wistful", "Reflective", "Bittersweet"],
  "Triumphant": ["Victorious", "Heroic", "Ascendant", "Glory Chord"],
};

function synonymSwap(value: string): string {
  const options = SYNONYM_MAP[value];
  if (!options || options.length === 0) return value;
  return options[Math.floor(Math.random() * options.length)];
}

export function createRandomGenome(baseKey = "Am"): MusicalGenome {
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  return {
    id: `g_${crypto.randomBytes(4).toString("hex")}`,
    base: baseKey,
    slots: {
      style: pick(["Ambient", "Cyberpunk", "Lo-Fi", "Orchestral"]),
      rhythm: pick(["Syncopated", "Four-on-the-floor", "Poly-rhythm"]),
      harmony: compatibleHarmony(baseKey, ["Modal Jazz", "Dark Minor", "Suspended 4ths"]),
      instrumentation: pick(["Analog Synth & Rhodes", "Strings & 808", "Acoustic Piano & Cello"]),
      mood: pick(["Melancholic", "Triumphant", "Hypnotic"]),
      era: pick(["Retro-Futuristic 2084", "Classical Baroque", "Digital Underground"]),
    },
    negative: "cliché, chaotic noise, distorted clipping, out of tune",
    cfg: Number((Math.random() * 4 + 6).toFixed(2)), // 6.0 - 10.0
    steps: 32,
    loraWeights: { "epoch_core": 0.75, "style_blend": 0.25 },
    seed: Math.floor(Math.random() * 1000000),
    fitness: 0.5,
    lineage: [],
  };
}

export function crossoverGenomes(a: MusicalGenome, b: MusicalGenome): MusicalGenome {
  const childSlots: any = {};
  for (const cat of SLOT_CATEGORIES) {
    childSlots[cat] = Math.random() < 0.5 ? a.slots[cat] : b.slots[cat];
  }
  const mergedWeights: Record<string, number> = {};
  const keyList = Array.from(new Set([...Object.keys(a.loraWeights), ...Object.keys(b.loraWeights)]));
  for (const k of keyList) {
    const wa = a.loraWeights[k] ?? 0.5;
    const wb = b.loraWeights[k] ?? 0.5;
    mergedWeights[k] = Number(((wa + wb) / 2).toFixed(2));
  }

  const base = Math.random() < 0.5 ? a.base : b.base;
  childSlots.harmony = compatibleHarmony(base, [a.slots.harmony, b.slots.harmony, childSlots.harmony]);

  return {
    id: `g_${crypto.randomBytes(4).toString("hex")}`,
    base,
    slots: childSlots,
    negative: `${a.negative}, ${b.negative}`.split(", ").filter((v, i, arr) => arr.indexOf(v) === i).join(", "),
    cfg: Number(((a.cfg + b.cfg) / 2).toFixed(2)),
    steps: Math.max(a.steps, b.steps),
    loraWeights: mergedWeights,
    seed: Math.floor(Math.random() * 1000000),
    fitness: 0.0,
    lineage: [a.id, b.id],
  };
}

export function mutateGenome(g: MusicalGenome, rate = 0.2, trendMods?: string[]): MusicalGenome {
  const cloned: MusicalGenome = JSON.parse(JSON.stringify(g));
  cloned.id = `g_${crypto.randomBytes(4).toString("hex")}`;
  cloned.lineage = [g.id];

  for (const cat of SLOT_CATEGORIES) {
    if (Math.random() < rate) {
      cloned.slots[cat] = synonymSwap(cloned.slots[cat]);
    }
  }

  if (Math.random() < rate && trendMods && trendMods.length > 0) {
    cloned.slots.era = trendMods[Math.floor(Math.random() * trendMods.length)];
  }

  if (Math.random() < rate * 0.5) {
    cloned.cfg = Number(Math.max(3, Math.min(12, cloned.cfg + (Math.random() * 2 - 1))).toFixed(2));
  }

  // Mutation may have changed a harmonic descriptor; restore compatibility
  // before this genome can be passed to the real composition pipeline.
  cloned.slots.harmony = compatibleHarmony(cloned.base, [cloned.slots.harmony]);

  cloned.seed = Math.floor(Math.random() * 1000000);
  return cloned;
}

export function evaluateGenomeQA(genome: MusicalGenome, musicIr: any): { qaScore: number; noveltyScore: number; passed: boolean } {
  // QA-gate anti-collapse criteria: harmony coherence + phonetic/prosodic score + novelty
  const coherence = musicIr?.evaluation?.score ? musicIr.evaluation.score / 100 : 0.8;
  const phonetic = musicIr?.evaluation?.phonetic_score ? musicIr.evaluation.phonetic_score / 100 : 0.8;
  const harmonyPass = isHarmonicallyCompatible(genome.base, genome.slots.harmony) ? 1 : 0;
  const qaScore = Number((0.45 * coherence + 0.45 * phonetic + 0.10 * harmonyPass).toFixed(2));
  const uniqueSlots = new Set(Object.values(genome.slots).map(value => value.toLowerCase())).size;
  const seedVariation = (genome.seed % 17) / 100;
  const noveltyScore = Number(Math.min(0.95, 0.45 + uniqueSlots * 0.06 + seedVariation).toFixed(2));

  const passed = qaScore >= 0.70 && noveltyScore >= 0.50;
  return { qaScore, noveltyScore, passed };
}
