import { describe, expect, it } from "vitest";
import { generateComposition, renderMidi, renderScoreText } from "./musicKernel";

describe("musicKernel", () => {
  it("genera una composición autónoma sin concepto", async () => {
    const updates: Array<{ stage: string; status: string; progress: number }> = [];
    const ir = await generateComposition({
      language: "Español",
      styles: ["The Smiths"],
      bpm: 105,
      key: "Am",
      provider: "local",
      onProgress: update => updates.push(update),
    });

    expect(updates.map(update => update.stage)).toEqual(["Planner", "Planner", "Compositor", "Compositor", "Productor", "Productor", "Evaluador", "Evaluador"]);
    expect(updates.at(-1)?.progress).toBe(100);
    expect(ir.concept.autonomous).toBe(true);
    expect(ir.concept.core_idea.length).toBeGreaterThan(10);
    expect(ir.musical.sections).toEqual(["Intro", "Verso", "Pre-Coro", "Coro", "Puente", "Outro"]);
    expect(ir.lyrics.content.Coro).toContain("luz");
    expect(ir.evaluation.phonetic_score).toBeGreaterThan(0);
    expect(ir.evaluation.prosody_score).toBeGreaterThan(0);
    expect(ir.lyrics.prosody.sections.Coro.cantability).toBeGreaterThan(0);
    expect(ir.history.map(entry => entry.agent)).toEqual(["Planner", "Compositor", "Productor", "Evaluador"]);
  });

  it("genera un MIDI con cabecera estándar y partitura textual", async () => {
    const ir = await generateComposition({
      theme: "una estación que vuelve a abrir",
      language: "Portugués",
      styles: ["Anitta"],
      bpm: 120,
      key: "C",
      provider: "local",
    });

    const midi = renderMidi(ir);
    expect(midi.subarray(0, 4).toString("ascii")).toBe("MThd");
    expect(midi.length).toBeGreaterThan(40);
    expect(renderScoreText(ir)).toContain("TÍTULO:");
    expect(renderScoreText(ir)).toContain("[Coro]");
  });

  it("usa el perfil armónico del genoma para gobernar la progresión calculada", async () => {
    const ir = await generateComposition({
      language: "Español",
      styles: ["The Smiths"],
      bpm: 100,
      key: "Am",
      provider: "local",
      genome: {
        id: "g_kernel_dark", base: "Am", negative: "", cfg: 8, steps: 32, loraWeights: {}, seed: 11, fitness: 0.5, lineage: [],
        slots: { style: "Ambient", rhythm: "Syncopated", harmony: "Dark Minor", instrumentation: "Analog Synth & Rhodes", mood: "Melancholic", era: "Retro-Futuristic 2084" },
      },
    });
    expect(ir.harmony.progression_notes).toContain("Dark Minor");
    expect(ir.harmony.chords.Intro).toContain("Dm7b5");
  });
});
