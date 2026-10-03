import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getScalePitchClasses, isMidiInScale, nearestScaleMidi, quantizeStepTime } from "./musicTheory";
import { BUILT_IN_DUCK_PRESETS, exportDuckVocalPreset, normalizeDuckVocalPreset } from "./presetLibrary";
import { canRedoDuckProject, canUndoDuckProject, commitDuckProject, createDuckProjectHistory, redoDuckProject, undoDuckProject } from "./projectHistory";
import { createDefaultDuckProject, exportDuckProject, normalizeDuckProject } from "./project";
import { getStepDurationSeconds, getStepOffsetSeconds, SCHEDULE_AHEAD_SECONDS, SCHEDULER_INTERVAL_MS } from "./sequencer";

describe("Duck Studio music theory", () => {
  it("derives the expected pitch classes for A minor", () => {
    expect(getScalePitchClasses("A", "minor")).toEqual([9, 11, 0, 2, 4, 5, 7]);
    expect(isMidiInScale(69, "A", "minor")).toBe(true);
    expect(isMidiInScale(70, "A", "minor")).toBe(false);
  });

  it("finds a safe nearest scale-guide target", () => {
    expect(nearestScaleMidi(70, "A", "minor")).toBe(69);
    expect(nearestScaleMidi(71, "A", "minor")).toBe(71);
  });

  it("quantizes musical steps and rejects invalid timing inputs", () => {
    expect(quantizeStepTime(4, 120)).toBe(0.5);
    expect(() => quantizeStepTime(1, 0)).toThrow("no son válidos");
  });
});

describe("Duck Studio project contract", () => {
  it("starts with an executable 16-step project and four voice lanes", () => {
    const project = createDefaultDuckProject();
    expect(project.lanes).toHaveLength(4);
    expect(project.lanes.every(lane => lane.steps.length === 16)).toBe(true);
    expect(project.pianoNotes.length).toBeGreaterThan(0);
    expect(project.scaleAssist).toBe(true);
    expect(project.midiMapping).toBe("transport");
    expect(project.lanes.every(lane => typeof lane.tone === "number" && typeof lane.drive === "number" && typeof lane.compression === "number")).toBe(true);
  });

  it("normalizes corrupt imported project values to a safe default", () => {
    const normalized = normalizeDuckProject({ version: 1, bpm: 900, swing: -1, lanes: [], pianoNotes: [], effects: {} });
    expect(normalized.bpm).toBe(240);
    expect(normalized.swing).toBe(0);
    expect(normalized.effects.limiter).toBeGreaterThan(0);
    expect(normalized.lanes).toEqual([]);
  });

  it("exports a portable project envelope without including audio bytes", () => {
    const exported = JSON.parse(exportDuckProject(createDefaultDuckProject())) as { format: string; lanes: unknown[]; exportedAt: string };
    expect(exported.format).toBe("duck-studio-project");
    expect(exported.lanes).toHaveLength(4);
    expect(new Date(exported.exportedAt).getTime()).not.toBeNaN();
  });
});

describe("Duck Studio presets and interface contracts", () => {
  it("normalizes an importable local vocal preset without accepting malformed data", () => {
    const preset = normalizeDuckVocalPreset({ id: "custom", name: "  Voz de prueba ", effects: { delay: 2, reverb: -1 }, createdAt: 1 });
    expect(preset).toMatchObject({ id: "custom", name: "Voz de prueba", createdAt: 1 });
    expect(preset?.effects.delay).toBe(1);
    expect(preset?.effects.reverb).toBe(0);
    expect(normalizeDuckVocalPreset({ name: "sin id" })).toBeNull();
  });

  it("ships portable built-in preset envelopes", () => {
    expect(BUILT_IN_DUCK_PRESETS.length).toBeGreaterThanOrEqual(3);
    const exported = JSON.parse(exportDuckVocalPreset(BUILT_IN_DUCK_PRESETS[0]!)) as { format: string; name: string };
    expect(exported.format).toBe("duck-vocal-preset");
    expect(exported.name).toBe("Clean Vocal");
  });

  it("keeps the critical interactive controls present in the Duck cockpit source contract", () => {
    const source = readFileSync(path.resolve(import.meta.dirname, "../../pages/DuckStudio.tsx"), "utf8");
    const audioEngineSource = readFileSync(path.resolve(import.meta.dirname, "audioEngine.ts"), "utf8");
    expect(source).toContain("Scale Assist");
    expect(source).toContain("Monitor sem eventos.");
    expect(source).toContain("saveDuckVocalPreset");
    expect(source).toContain("aria-live=\"polite\"");
    expect(source).toContain("toggleRecording");
    expect(source).toContain("setTrackMix");
    expect(source).toContain("getTrackMeter");
    expect(source).toContain("TONE");
    expect(source).toContain("DRIVE");
    expect(source).toContain("COMP");
    expect(audioEngineSource).toContain("trackCompressor");
    expect(source).toContain("importProjectFile");
    expect(source).toContain("Ctrl/Cmd + S");
    expect(source).toContain("Ctrl/Cmd + E");
    expect(source).toContain("saveLocalProject");
    expect(source).toContain("restoreHistory");
  });
});

describe("Duck Studio project history", () => {
  it("commits, undoes and redoes local project changes without losing a branch", () => {
    const base = createDefaultDuckProject();
    const renamed = { ...base, name: "Historial A", updatedAt: base.updatedAt + 1 };
    const retimed = { ...renamed, bpm: 128, updatedAt: renamed.updatedAt + 1 };
    let history = createDuckProjectHistory(base, 4);
    history = commitDuckProject(history, renamed);
    history = commitDuckProject(history, retimed);
    expect(canUndoDuckProject(history)).toBe(true);
    history = undoDuckProject(history);
    expect(history.entries[history.index]?.name).toBe("Historial A");
    expect(canRedoDuckProject(history)).toBe(true);
    history = redoDuckProject(history);
    expect(history.entries[history.index]?.bpm).toBe(128);
  });
});

describe("Duck Studio foreground scheduler", () => {
  it("uses musical sixteenth-note timing and applies swing only to offbeats", () => {
    expect(getStepDurationSeconds(120)).toBe(0.125);
    expect(getStepOffsetSeconds(0, 120, 0.25)).toBe(0.125);
    expect(getStepOffsetSeconds(1, 120, 0.25)).toBeCloseTo(0.15625);
  });

  it("keeps foreground scheduling bounded to short interactive intervals", () => {
    expect(SCHEDULER_INTERVAL_MS).toBeLessThanOrEqual(30);
    expect(SCHEDULE_AHEAD_SECONDS).toBeGreaterThan(0);
    expect(SCHEDULE_AHEAD_SECONDS).toBeLessThanOrEqual(0.15);
  });
});
