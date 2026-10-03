import { describe, it, expect } from "vitest";
import { createRandomGenome, crossoverGenomes, isHarmonicallyCompatible, mutateGenome, evaluateGenomeQA } from "./musicGenome";
import { INITIAL_LORE_GRAPH, findOrphanNodes, suggestCrossover } from "./musicLore";

describe("MUSIC OS Advanced Systems — Genoma y Lore", () => {
  it("crea un genoma aleatorio con slots válidos y estructura tipada", () => {
    const genome = createRandomGenome("Dm");
    expect(genome.id).toMatch(/^g_[a-f0-9]+$/);
    expect(genome.base).toBe("Dm");
    expect(genome.slots.style).toBeDefined();
    expect(genome.slots.rhythm).toBeDefined();
    expect(genome.fitness).toBe(0.5);
  });

  it("realiza crossover entre genomas preservando linaje y slots", () => {
    const parentA = createRandomGenome("Am");
    const parentB = createRandomGenome("Em");
    const child = crossoverGenomes(parentA, parentB);

    expect(child.lineage).toContain(parentA.id);
    expect(child.lineage).toContain(parentB.id);
    expect(child.id).not.toBe(parentA.id);
    expect(isHarmonicallyCompatible(child.base, child.slots.harmony)).toBe(true);
  });

  it("aplica mutación al genoma con tasa controlada", () => {
    const original = createRandomGenome("C");
    const mutated = mutateGenome(original, 1.0); // tasa alta para forzar cambio

    expect(mutated.id).not.toBe(original.id);
    expect(mutated.lineage).toContain(original.id);
  });

  it("evalúa el QA-gate anti-colapso correctamente", () => {
    const genome = createRandomGenome("Am");
    const mockIr = {
      evaluation: {
        score: 85,
        phonetic_score: 80,
      },
    };
    const result = evaluateGenomeQA(genome, mockIr);
    expect(result.qaScore).toBeGreaterThanOrEqual(0.70);
    expect(result.passed).toBe(true);
  });

  it("detecta nodos huérfanos y sugiere crossovers en el Lore Engine", () => {
    const orphans = findOrphanNodes(INITIAL_LORE_GRAPH.nodes, INITIAL_LORE_GRAPH.relations);
    expect(Array.isArray(orphans)).toBe(true);

    const crossovers = suggestCrossover(INITIAL_LORE_GRAPH.nodes, INITIAL_LORE_GRAPH.relations);
    expect(crossovers.length).toBeGreaterThan(0);
    expect(crossovers[0].factionA).toBe("Mycelium Chrome");
  });
});
