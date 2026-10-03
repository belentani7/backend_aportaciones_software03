import { DEFAULT_DUCK_EFFECTS, type DuckEffects } from "./audioEngine";

export type DuckVocalPreset = {
  id: string;
  name: string;
  effects: DuckEffects;
  builtIn?: boolean;
  createdAt: number;
};

const PRESET_STORAGE_KEY = "duck-studio-vocal-presets-v1";

export const BUILT_IN_DUCK_PRESETS: DuckVocalPreset[] = [
  { id: "duck-clean-vocal", name: "Clean Vocal", effects: { ...DEFAULT_DUCK_EFFECTS, gate: 0.72, eq: 0.62, compressor: 0.48, drive: 0.04, delay: 0.08, reverb: 0.12, limiter: 0.68 }, builtIn: true, createdAt: 0 },
  { id: "duck-night-tape", name: "Night Tape", effects: { ...DEFAULT_DUCK_EFFECTS, gate: 0.58, eq: 0.42, compressor: 0.72, drive: 0.43, chorus: 0.26, delay: 0.32, reverb: 0.38, width: 0.44 }, builtIn: true, createdAt: 0 },
  { id: "duck-bright-pop", name: "Bright Pop", effects: { ...DEFAULT_DUCK_EFFECTS, gate: 0.85, eq: 0.78, deEsser: 0.55, compressor: 0.58, drive: 0.1, delay: 0.18, reverb: 0.22, width: 0.3 }, builtIn: true, createdAt: 0 },
];

function normalizeEffects(value: unknown): DuckEffects {
  const candidate = value && typeof value === "object" ? value as Partial<DuckEffects> : {};
  return Object.fromEntries(Object.entries(DEFAULT_DUCK_EFFECTS).map(([key, fallback]) => {
    const candidateValue = candidate[key as keyof DuckEffects];
    return [key, typeof candidateValue === "number" && Number.isFinite(candidateValue) ? Math.max(0, Math.min(1, candidateValue)) : fallback];
  })) as DuckEffects;
}

export function normalizeDuckVocalPreset(value: unknown): DuckVocalPreset | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<DuckVocalPreset>;
  if (typeof candidate.id !== "string" || typeof candidate.name !== "string" || !candidate.name.trim()) return null;
  return { id: candidate.id, name: candidate.name.trim().slice(0, 64), effects: normalizeEffects(candidate.effects), createdAt: typeof candidate.createdAt === "number" ? candidate.createdAt : Date.now() };
}

export function loadDuckVocalPresets() {
  try {
    if (typeof window === "undefined") return [...BUILT_IN_DUCK_PRESETS];
    const stored = JSON.parse(window.localStorage.getItem(PRESET_STORAGE_KEY) ?? "[]") as unknown;
    const custom = Array.isArray(stored) ? stored.map(normalizeDuckVocalPreset).filter((preset): preset is DuckVocalPreset => Boolean(preset)) : [];
    return [...BUILT_IN_DUCK_PRESETS, ...custom];
  } catch {
    return [...BUILT_IN_DUCK_PRESETS];
  }
}

export function saveDuckVocalPreset(name: string, effects: DuckEffects) {
  const preset = normalizeDuckVocalPreset({ id: crypto.randomUUID(), name, effects, createdAt: Date.now() });
  if (!preset) throw new Error("El nombre del preset es obligatorio.");
  try {
    const custom = loadDuckVocalPresets().filter(item => !item.builtIn).filter(item => item.name.toLowerCase() !== preset.name.toLowerCase());
    window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify([...custom, preset]));
    return preset;
  } catch {
    throw new Error("No fue posible guardar el preset local.");
  }
}

export function deleteDuckVocalPreset(id: string) {
  if (BUILT_IN_DUCK_PRESETS.some(preset => preset.id === id)) return false;
  try {
    const custom = loadDuckVocalPresets().filter(item => !item.builtIn && item.id !== id);
    window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(custom));
    return true;
  } catch {
    return false;
  }
}

export function exportDuckVocalPreset(preset: DuckVocalPreset) {
  return JSON.stringify({ format: "duck-vocal-preset", exportedAt: new Date().toISOString(), ...preset }, null, 2);
}
