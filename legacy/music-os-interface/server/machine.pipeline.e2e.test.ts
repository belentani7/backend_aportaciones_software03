import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("machine pipeline end-to-end", () => {
  it("persiste composición, genoma, checksum WORM y proveniencia en un proceso local aislado", async () => {
    const projectRoot = path.resolve(import.meta.dirname, "..");
    const { stdout } = await execFileAsync("pnpm", ["exec", "tsx", "scripts/smoke-machine.mjs"], {
      cwd: projectRoot,
      timeout: 20_000,
      env: process.env,
    });
    const output = JSON.parse(stdout.trim()) as { compositionId: number; genomeId: string; checksum: string; provenanceModel: string; persistedArtifacts: number; loreNodeIds: string[] };
    expect(output.compositionId).toBeGreaterThan(0);
    expect(output.genomeId).toMatch(/^g_/);
    expect(output.checksum).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(output.provenanceModel).toBe("deterministic-kernel");
    expect(output.persistedArtifacts).toBe(1);
    expect(output.loreNodeIds.length).toBeGreaterThan(0);
    expect(output.loreNodeIds[0]).toBe("fac_mycelium");
  }, 25_000);
});
