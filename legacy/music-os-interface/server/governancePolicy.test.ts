import { describe, expect, it } from "vitest";
import { canArchive, canProduce } from "./governancePolicy";

describe("governance control policy", () => {
  it("bloquea de forma determinista la producción cuando se pausa o se detiene el organismo", () => {
    expect(canProduce("active")).toBe(true);
    expect(canProduce("paused_publishing")).toBe(true);
    expect(canProduce("paused_production")).toBe(false);
    expect(canProduce("total_halt")).toBe(false);
  });

  it("bloquea el archivado cuando el kill-switch pausa publicación o activa parada total", () => {
    expect(canArchive("active")).toBe(true);
    expect(canArchive("paused_production")).toBe(true);
    expect(canArchive("paused_publishing")).toBe(false);
    expect(canArchive("total_halt")).toBe(false);
  });
});
