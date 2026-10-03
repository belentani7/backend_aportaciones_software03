import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type TestUser = NonNullable<TrpcContext["user"]>;

function context(): TrpcContext {
  const user: TestUser = {
    id: 1,
    openId: "audit-user",
    email: "audit@example.com",
    name: "Audit User",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("composition router", () => {
  it("rechaza parámetros fuera de los límites musicales", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.composition.generate({
      language: "Español",
      styles: ["The Smiths"],
      bpm: 400,
      key: "Am",
      provider: "local",
      model: "deterministic-kernel",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rechaza identificadores de modelo con caracteres no permitidos", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.composition.generate({
      language: "Español",
      styles: ["The Smiths"],
      bpm: 105,
      key: "Am",
      provider: "local",
      model: "model; rm -rf /",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("prepara un job con estado y Event Bus consultables", async () => {
    const caller = appRouter.createCaller(context());
    const prepared = await caller.composition.prepare({ language: "Español", styles: ["The Smiths"], bpm: 105, key: "Am", provider: "local", model: "deterministic-kernel" });
    expect(prepared.status).toBe("queued");
    expect(prepared.progress).toBe(0);
    expect(prepared.stages.map(stage => stage.name)).toEqual(["Planner", "Compositor", "Productor", "Evaluador"]);
    const status = await caller.composition.status({ jobId: prepared.jobId });
    expect(status.history[0]?.agent).toBe("Sistema");
    expect(status.status).toBe("queued");
  });

  it("rechaza consultar un job perteneciente a otro usuario", async () => {
    const ownerContext = context();
    if (ownerContext.user) ownerContext.user = { ...ownerContext.user, id: 2 };
    const ownerCaller = appRouter.createCaller(ownerContext);
    const prepared = await ownerCaller.composition.prepare({ language: "Español", styles: ["The Smiths"], bpm: 105, key: "Am", provider: "local" });
    const otherContext = context();
    if (otherContext.user) otherContext.user = { ...otherContext.user, id: 999 };
    const otherCaller = appRouter.createCaller(otherContext);
    await expect(otherCaller.composition.status({ jobId: prepared.jobId })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("permite consultar el historial únicamente dentro del contexto autenticado", async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const caller = appRouter.createCaller(context());
      const rows = await caller.composition.list();
      expect(Array.isArray(rows)).toBe(true);
    } finally {
      if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousDatabaseUrl;
    }
  });

});
