import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createComposition, getCompositionForUser, listCompositionsForUser } from "./db";
import { createContext } from "./_core/context";

const previousDesktop = process.env.MUSIC_OS_DESKTOP;
const previousDataDir = process.env.MUSIC_OS_LOCAL_DATA_DIR;
const previousDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (previousDesktop === undefined) delete process.env.MUSIC_OS_DESKTOP;
  else process.env.MUSIC_OS_DESKTOP = previousDesktop;
  if (previousDataDir === undefined) delete process.env.MUSIC_OS_LOCAL_DATA_DIR;
  else process.env.MUSIC_OS_LOCAL_DATA_DIR = previousDataDir;
  if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = previousDatabaseUrl;
});

describe("desktop local mode", () => {
  it("creates a local authenticated identity only on loopback", async () => {
    process.env.MUSIC_OS_DESKTOP = "1";
    const req = { hostname: "127.0.0.1", socket: { remoteAddress: "127.0.0.1" }, headers: {} } as any;
    const res = {} as any;
    const context = await createContext({ req, res } as any);
    expect(context.user?.id).toBe(0);
    expect(context.user?.loginMethod).toBe("desktop-local");
  });

  it("persists and isolates compositions in the configured local directory", async () => {
    process.env.MUSIC_OS_DESKTOP = "1";
    delete process.env.DATABASE_URL;
    process.env.MUSIC_OS_LOCAL_DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "music-os-"));
    const row = await createComposition({
      userId: 0,
      title: "Local Composition",
      musicIrJson: JSON.stringify({ metadata: { title: "Local Composition" } }),
      provider: "local",
      model: "deterministic-kernel",
    });
    expect(row?.id).toBe(1);
    expect((await listCompositionsForUser(0)).map(item => item.title)).toEqual(["Local Composition"]);
    expect(await getCompositionForUser(1, 999)).toBeUndefined();
    await fs.rm(process.env.MUSIC_OS_LOCAL_DATA_DIR, { recursive: true, force: true });
  });
});
