import { listPackage } from "../node_modules/.pnpm/@electron+asar@3.4.1/node_modules/@electron/asar/lib/asar.js";

const archive = process.argv[2];
if (!archive) throw new Error("Usage: node scripts/inspect-asar.mjs <app.asar>");
const entries = await listPackage(archive);
const required = ["desktop/main.mjs", "dist/index.js", "dist/public/index.html"];
for (const entry of required) {
  const match = entries.some(candidate => candidate === entry || candidate === `/${entry}`);
  console.log(`${match ? "OK" : "MISSING"} ${entry}`);
}
const missing = required.filter(entry => !entries.some(candidate => candidate === entry || candidate === `/${entry}`));
if (missing.length > 0) process.exitCode = 1;
