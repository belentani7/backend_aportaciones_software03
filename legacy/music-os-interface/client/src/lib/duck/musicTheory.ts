export const DUCK_SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
} as const;

export type DuckScale = keyof typeof DUCK_SCALES;

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

export function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function getScalePitchClasses(root: string, scale: DuckScale) {
  const rootPitchClass = NOTE_TO_SEMITONE[root] ?? NOTE_TO_SEMITONE.C;
  return DUCK_SCALES[scale].map(interval => (rootPitchClass + interval) % 12);
}

export function isMidiInScale(midi: number, root: string, scale: DuckScale) {
  return getScalePitchClasses(root, scale).includes(((midi % 12) + 12) % 12);
}

/** Finds the nearest allowed MIDI note. Used as a transparent pitch-guide target, not as a claim of formant-preserving autotune. */
export function nearestScaleMidi(midi: number, root: string, scale: DuckScale) {
  const candidates = Array.from({ length: 25 }, (_, index) => midi - 12 + index).filter(candidate => isMidiInScale(candidate, root, scale));
  const firstCandidate = candidates[0];
  if (firstCandidate === undefined) return midi;
  return candidates.reduce((closest, candidate) => Math.abs(candidate - midi) < Math.abs(closest - midi) ? candidate : closest, firstCandidate);
}

export function quantizeStepTime(step: number, bpm: number, stepsPerBeat = 4) {
  if (!Number.isFinite(step) || !Number.isFinite(bpm) || bpm <= 0 || stepsPerBeat <= 0) throw new Error("Los parámetros de cuantización no son válidos.");
  return step * 60 / bpm / stepsPerBeat;
}
