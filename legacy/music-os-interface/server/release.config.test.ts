import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");

describe("release configuration", () => {
  it("pins pnpm with a complete SHA-512 digest", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")) as {
      packageManager?: string;
    };
    expect(packageJson.packageManager).toMatch(/^pnpm@10\.4\.1\+sha512\.[a-f0-9]{128}$/);
  });

  it("keeps React in Rollup's normal graph to avoid a chunk cycle", () => {
    const viteConfig = fs.readFileSync(path.join(projectRoot, "vite.config.ts"), "utf8");
    expect(viteConfig).not.toContain('return "react-runtime"');
  });

  it("excludes local build artifacts from the Docker context", () => {
    const dockerignore = fs.readFileSync(path.join(projectRoot, ".dockerignore"), "utf8");
    for (const entry of ["node_modules", "release", "dist", ".git"]) {
      expect(dockerignore.split(/\r?\n/)).toContain(entry);
    }
  });
});
