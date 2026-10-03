import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const matrixPath = path.resolve(import.meta.dirname, "../IMPROVEMENT_MATRIX.md");

describe("registro de 400 mejoras", () => {
  it("mantiene 400 IDs únicos, consecutivos, con estado y evidencia individual", () => {
    const matrix = readFileSync(matrixPath, "utf8");
    const items = [...matrix.matchAll(/^- \[([ x])\] (IM-(\d{3})) — .+ · Evidencia: (.+)$/gm)];
    expect(items).toHaveLength(400);
    expect(new Set(items.map(item => item[2])).size).toBe(400);
    expect(items.map(item => Number(item[3]))).toEqual(Array.from({ length: 400 }, (_, index) => index + 1));
    expect(items.every(item => item[1] === " " || item[1] === "x")).toBe(true);
  });

  it("define una ruta de evidencia no vacía para cada rango de cuarenta mejoras", () => {
    const matrix = readFileSync(matrixPath, "utf8");
    const bindings = [...matrix.matchAll(/\| IM-(\d{3})–IM-(\d{3}) \| ([^|]+) \| `([^`]+)`/g)];
    expect(bindings).toHaveLength(10);
    expect(bindings.map(binding => [Number(binding[1]), Number(binding[2])])).toEqual(Array.from({ length: 10 }, (_, index) => [index * 40 + 1, index * 40 + 40]));
    expect(bindings.every(binding => binding[3].trim().length > 0 && binding[4].trim().length > 0)).toBe(true);
  });
});
