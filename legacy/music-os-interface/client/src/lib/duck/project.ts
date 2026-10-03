import { DEFAULT_DUCK_EFFECTS, type DuckEffects } from "./audioEngine";
import type { DuckScale } from "./musicTheory";

export type DuckLaneId = "kick" | "snare" | "hat" | "bass";

export type DuckLane = {
  id: DuckLaneId;
  name: string;
  color: string;
  midi: number;
  steps: boolean[];
  muted: boolean;
  solo: boolean;
  gain: number;
  pan: number;
  tone: number;
  drive: number;
  compression: number;
};

export type DuckPianoNote = {
  id: string;
  midi: number;
  start: number;
  length: number;
  velocity: number;
};

export type DuckProject = {
  version: 1;
  name: string;
  bpm: number;
  root: string;
  scale: DuckScale;
  scaleAssist: boolean;
  midiMapping: "none" | "transport";
  swing: number;
  stepsPerPattern: number;
  effects: DuckEffects;
  lanes: DuckLane[];
  pianoNotes: DuckPianoNote[];
  updatedAt: number;
};

export const DUCK_PROJECT_STORAGE_KEY = "duck-studio-project-v1";

function createSteps(active: number[]) {
  return Array.from({ length: 16 }, (_, index) => active.includes(index));
}

export function createDefaultDuckProject(): DuckProject {
  return {
    version: 1,
    name: "Novo beat Duck",
    bpm: 104,
    root: "A",
    scale: "minor",
    scaleAssist: true,
    midiMapping: "transport",
    swing: 0.08,
    stepsPerPattern: 16,
    effects: { ...DEFAULT_DUCK_EFFECTS },
    lanes: [
      { id: "kick", name: "Kick", color: "#35e99e", midi: 36, steps: createSteps([0, 4, 8, 12]), muted: false, solo: false, gain: 0.86, pan: 0, tone: 0.7, drive: 0.05, compression: 0.32 },
      { id: "snare", name: "Snare", color: "#e3ff72", midi: 38, steps: createSteps([4, 12]), muted: false, solo: false, gain: 0.68, pan: 0.08, tone: 0.76, drive: 0.16, compression: 0.48 },
      { id: "hat", name: "Hat", color: "#72d8ff", midi: 42, steps: createSteps([2, 6, 10, 14]), muted: false, solo: false, gain: 0.52, pan: -0.12, tone: 0.88, drive: 0.04, compression: 0.2 },
      { id: "bass", name: "Bass", color: "#c0a5ff", midi: 45, steps: createSteps([0, 6, 8, 14]), muted: false, solo: false, gain: 0.72, pan: -0.04, tone: 0.42, drive: 0.24, compression: 0.58 },
    ],
    pianoNotes: [
      { id: "bass-1", midi: 45, start: 0, length: 3, velocity: 0.82 },
      { id: "bass-2", midi: 48, start: 4, length: 3, velocity: 0.72 },
      { id: "bass-3", midi: 52, start: 8, length: 3, velocity: 0.78 },
      { id: "bass-4", midi: 48, start: 12, length: 3, velocity: 0.76 },
    ],
    updatedAt: Date.now(),
  };
}

function isLane(value: unknown): value is DuckLane {
  if (!value || typeof value !== "object") return false;
  const lane = value as Partial<DuckLane>;
  return typeof lane.id === "string" && typeof lane.name === "string" && Array.isArray(lane.steps) && lane.steps.every(step => typeof step === "boolean");
}

export function normalizeDuckProject(value: unknown): DuckProject {
  const fallback = createDefaultDuckProject();
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<DuckProject>;
  if (candidate.version !== 1 || !Array.isArray(candidate.lanes) || !candidate.lanes.every(isLane)) return fallback;
  return {
    ...fallback,
    ...candidate,
    bpm: typeof candidate.bpm === "number" ? Math.min(240, Math.max(40, candidate.bpm)) : fallback.bpm,
    swing: typeof candidate.swing === "number" ? Math.min(0.5, Math.max(0, candidate.swing)) : fallback.swing,
    scaleAssist: typeof candidate.scaleAssist === "boolean" ? candidate.scaleAssist : fallback.scaleAssist,
    midiMapping: candidate.midiMapping === "transport" ? "transport" : "none",
    effects: { ...fallback.effects, ...(candidate.effects ?? {}) },
    lanes: candidate.lanes.map(lane => ({ ...lane, tone: typeof lane.tone === "number" ? Math.min(1, Math.max(0, lane.tone)) : 0.7, drive: typeof lane.drive === "number" ? Math.min(1, Math.max(0, lane.drive)) : 0, compression: typeof lane.compression === "number" ? Math.min(1, Math.max(0, lane.compression)) : 0.4, steps: Array.from({ length: 16 }, (_, index) => Boolean(lane.steps[index])) })),
    pianoNotes: Array.isArray(candidate.pianoNotes) ? candidate.pianoNotes.filter(note => note && typeof note.midi === "number" && typeof note.start === "number" && typeof note.length === "number") : fallback.pianoNotes,
    updatedAt: typeof candidate.updatedAt === "number" ? candidate.updatedAt : Date.now(),
  } as DuckProject;
}

export function loadDuckProject() {
  try {
    if (typeof window === "undefined") return createDefaultDuckProject();
    const raw = window.localStorage.getItem(DUCK_PROJECT_STORAGE_KEY);
    return raw ? normalizeDuckProject(JSON.parse(raw)) : createDefaultDuckProject();
  } catch {
    return createDefaultDuckProject();
  }
}

export function saveDuckProject(project: DuckProject) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(DUCK_PROJECT_STORAGE_KEY, JSON.stringify({ ...project, updatedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export function exportDuckProject(project: DuckProject) {
  return JSON.stringify({ ...project, exportedAt: new Date().toISOString(), format: "duck-studio-project" }, null, 2);
}
