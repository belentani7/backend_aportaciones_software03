import { describe, it, expect } from "vitest";
import { evaluateFinetuneRollback, validateHarmonicCollision, runNightlyFinetuneSimulation, getLoreGraphData } from "./advancedEngine";

describe("MUSIC OS Advanced Engine (Volume II)", () => {
  it("valida colisión armónica según tonalidad y armonía", () => {
    expect(validateHarmonicCollision("Am", "Dark Minor")).toBe(true);
    expect(validateHarmonicCollision("Am", "Invalid Harmony")).toBe(false);
  });

  it("ejecuta simulación de fine-tune nocturno con ratio y rollback", async () => {
    const result = await runNightlyFinetuneSimulation(1);
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.message).toBe("string");
  });

  it("decide rollback de forma determinista ante colapso o deriva", () => {
    expect(evaluateFinetuneRollback({ fidelity: 0.95, diversity: 0.79 })).toEqual({ rollback: true, reason: "COLLAPSE_RISK" });
    expect(evaluateFinetuneRollback({ fidelity: 0.80, diversity: 0.88 })).toEqual({ rollback: true, reason: "DRIFT" });
    expect(evaluateFinetuneRollback({ fidelity: 0.93, diversity: 0.86 })).toEqual({ rollback: false, reason: "APPROVED" });
  });

  it("recupera datos del grafo de lore y cuenta huérfanos", async () => {
    const graph = await getLoreGraphData();
    expect(Array.isArray(graph.nodes)).toBe(true);
    expect(Array.isArray(graph.relations)).toBe(true);
    expect(typeof graph.orphansCount).toBe("number");
  });
});
