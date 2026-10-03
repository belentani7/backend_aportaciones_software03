import fs from "node:fs/promises";
import path from "node:path";

const dataDir = path.join("/tmp", `music-os-machine-smoke-${Date.now()}`);
process.env.MUSIC_OS_DESKTOP = "1";
process.env.MUSIC_OS_LOCAL_DATA_DIR = dataDir;
delete process.env.DATABASE_URL;

try {
  const { appRouter } = await import("../server/routers.ts");
  const now = new Date();
  const context = {
    user: { id: 1, openId: "smoke-machine", name: "Smoke Machine", email: null, loginMethod: "test", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { protocol: "https", headers: {} },
    res: {},
  };
  const result = await appRouter.createCaller(context).composition.generate({
    language: "Español",
    styles: ["The Smiths"],
    bpm: 105,
    key: "Am",
    provider: "local",
    model: "deterministic-kernel",
  });
  const artifacts = JSON.parse(await fs.readFile(path.join(dataDir, "composition-artifacts.json"), "utf8"));
  const output = {
    compositionId: result.id,
    genomeId: result.musicIr.organism?.genome?.id,
    checksum: artifacts[0]?.checksum,
    provenanceModel: artifacts[0]?.provenance?.c2paMetadata?.model,
    loreNodeIds: artifacts[0]?.loreNodeIds,
    persistedArtifacts: artifacts.length,
  };
  if (!output.compositionId || !output.genomeId || !String(output.checksum).startsWith("sha256:") || output.persistedArtifacts !== 1 || !Array.isArray(output.loreNodeIds) || output.loreNodeIds.length === 0) {
    throw new Error(`Machine smoke failed: ${JSON.stringify(output)}`);
  }
  console.log(JSON.stringify(output));
} finally {
  await fs.rm(dataDir, { recursive: true, force: true });
}
