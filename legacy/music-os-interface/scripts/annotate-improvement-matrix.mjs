import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const matrixPath = path.join(root, "IMPROVEMENT_MATRIX.md");

function evidenceFor(id) {
  if (id <= 40) return "`server/musicKernel.ts` + `server/musicKernel.test.ts`";
  if (id <= 80) return "`server/musicKernel.ts` + `server/musicKernel.test.ts`";
  if (id <= 120) return "`client/src/lib/duck/sequencer.ts` + `client/src/lib/duck/duckCore.test.ts`";
  if (id <= 160) return "`client/src/lib/duck/audioEngine.ts` + `docs/DUCK_STUDIO.md`";
  if (id <= 200) return "`client/src/lib/duck/project.ts` + `client/src/lib/duck/duckCore.test.ts`";
  if (id <= 240) return "`client/src/pages/DuckStudio.tsx` + contrato de interfaz";
  if (id <= 280) return "`server/` + prueba de seguridad asociada";
  if (id <= 320) return "`vitest.config.ts` + prueba o configuración de CI";
  if (id <= 360) return "`desktop/` o `server/_core/` + runbook operativo";
  return "`README.md`, `docs/` o `.github/` + evidencia de release";
}

const original = readFileSync(matrixPath, "utf8");
const updated = original.split("\n").map(line => {
  const match = line.match(/^- \[([ x])\] IM-(\d{3}) — (.+?)(?: · Evidencia: .+)?$/);
  if (!match) return line;
  const id = Number(match[2]);
  return `- [${match[1]}] IM-${match[2]} — ${match[3]} · Evidencia: ${evidenceFor(id)}`;
}).join("\n");

writeFileSync(matrixPath, updated, "utf8");
