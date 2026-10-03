const { appRouter } = await import("../server/routers.ts");
const { setOrganismControl } = await import("../server/db.ts");

const now = new Date();
const context = {
  user: { id: 1, openId: "control-smoke", name: "Control Smoke", email: null, loginMethod: "test", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now },
  req: { protocol: "https", headers: {} },
  res: {},
};

await setOrganismControl("governance", { status: "paused_production", constitutionVersion: "v1.0.0-immutable", nsfwFilterActive: true });
try {
  await appRouter.createCaller(context).composition.generate({
    language: "Español", styles: ["The Smiths"], bpm: 105, key: "Am", provider: "local", model: "deterministic-kernel",
  });
  throw new Error("Kill-switch smoke failed: production was admitted");
} catch (error) {
  if (error?.code !== "FORBIDDEN") throw error;
  console.log(JSON.stringify({ rejected: true, code: error.code }));
} finally {
  await setOrganismControl("governance", { status: "active", constitutionVersion: "v1.0.0-immutable", nsfwFilterActive: true });
}
