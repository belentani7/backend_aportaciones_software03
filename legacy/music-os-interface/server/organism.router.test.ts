import { describe, expect, it, vi } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getOrganismControl: vi.fn(async () => ({ status: "paused_production" })),
    getLiveLoreGraph: vi.fn(async () => ({
      nodes: [{ id: "fac_a", kind: "faction", name: "Faction A", description: "A", season: 1, degree: 1 }],
      relations: [{ sourceId: "fac_a", targetId: "sym_b", relationType: "DEPICTS" }],
      orphanIds: [],
    })),
  };
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("organism router machine controls", () => {
  it("rechaza la generación real cuando el kill-switch persistente está en pausa de producción", async () => {
    const now = new Date();
    const ctx: TrpcContext = {
      user: { id: 77, openId: "machine-control", name: "Machine Control", email: null, loginMethod: "test", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.composition.generate({ language: "Español", styles: ["The Smiths"], bpm: 105, key: "Am", provider: "local" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("expone nodos y relaciones para el grafo arqueológico del frontend", async () => {
    const now = new Date();
    const ctx: TrpcContext = {
      user: { id: 77, openId: "lore-graph", name: "Lore Graph", email: null, loginMethod: "test", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const graph = await appRouter.createCaller(ctx).organism.lore();
    expect(graph.nodes[0]?.id).toBe("fac_a");
    expect(graph.relations[0]).toMatchObject({ sourceId: "fac_a", targetId: "sym_b", relationType: "DEPICTS" });
  });
});
