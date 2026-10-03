import type { DuckAudioEngine } from "./audioEngine";
import type { DuckProject } from "./project";

export type DuckSequencerEvent = { step: number; when: number };

export const SCHEDULER_INTERVAL_MS = 25;
export const SCHEDULE_AHEAD_SECONDS = 0.12;

export function getStepDurationSeconds(bpm: number) {
  if (!Number.isFinite(bpm) || bpm <= 0) throw new Error("El BPM debe ser mayor que cero.");
  return 60 / bpm / 4;
}

export function getStepOffsetSeconds(step: number, bpm: number, swing: number) {
  const base = getStepDurationSeconds(bpm);
  return base + (step % 2 === 1 ? base * Math.min(0.5, Math.max(0, swing)) : 0);
}

/** A foreground-only audio scheduler. It exists only while the user presses play; it is not a server timer or a persistent job. */
export class DuckSequencer {
  private timer: number | null = null;
  private nextStepAt = 0;
  private step = 0;
  private onStep: ((event: DuckSequencerEvent) => void) | null = null;

  get isPlaying() {
    return this.timer !== null;
  }

  start(engine: DuckAudioEngine, getProject: () => DuckProject, onStep?: (event: DuckSequencerEvent) => void) {
    this.stop();
    this.onStep = onStep ?? null;
    this.step = 0;
    this.nextStepAt = engine.currentTime + 0.06;
    const tick = () => {
      const project = getProject();
      while (this.nextStepAt < engine.currentTime + SCHEDULE_AHEAD_SECONDS) {
        this.scheduleStep(engine, project, this.step, this.nextStepAt);
        this.onStep?.({ step: this.step, when: this.nextStepAt });
        this.nextStepAt += getStepOffsetSeconds(this.step, project.bpm, project.swing);
        this.step = (this.step + 1) % project.stepsPerPattern;
      }
      this.timer = window.setTimeout(tick, SCHEDULER_INTERVAL_MS);
    };
    tick();
  }

  stop() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    this.onStep = null;
  }

  private scheduleStep(engine: DuckAudioEngine, project: DuckProject, step: number, when: number) {
    const soloed = project.lanes.filter(lane => lane.solo);
    const activeLanes = soloed.length ? soloed : project.lanes.filter(lane => !lane.muted);
    for (const lane of activeLanes) {
      if (!lane.steps[step]) continue;
      const destination = engine.getTrackInput(lane.id);
      if (lane.id === "bass") engine.scheduleSynthNote(lane.midi, when, getStepDurationSeconds(project.bpm) * 0.82, 1, 0, destination);
      else engine.scheduleDrum(lane.id, when, 1, 0, destination);
    }
    for (const note of project.pianoNotes) {
      if (note.start !== step) continue;
      engine.scheduleSynthNote(note.midi, when, Math.max(0.04, note.length * getStepDurationSeconds(project.bpm)), note.velocity, 0, engine.getTrackInput("bass"));
    }
  }
}
