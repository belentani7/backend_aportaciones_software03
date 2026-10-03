import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getCompositionArtifactForUser,
  ensureOperationalLore,
  getLiveLoreGraph,
  getOrganismControl,
  setOrganismControl,
} from "../db";
import { calculateEconomics } from "../musicGovernance";
import { protectedProcedure, router } from "../_core/trpc";

const governanceSchema = z.object({
  status: z.enum(["active", "paused_publishing", "paused_production", "total_halt"]),
  constitutionVersion: z.string(),
  nsfwFilterActive: z.boolean(),
  updatedBy: z.number().optional(),
  updatedAt: z.string().optional(),
});

const DEFAULT_GOVERNANCE = {
  status: "active" as const,
  constitutionVersion: "v1.0.0-immutable",
  nsfwFilterActive: true,
};

export const organismRouter = router({
  status: protectedProcedure.query(async () => {
    await ensureOperationalLore();
    const [governance, lore] = await Promise.all([
      getOrganismControl("governance", DEFAULT_GOVERNANCE),
      getLiveLoreGraph(),
    ]);
    return {
      governance: governanceSchema.parse(governance),
      economics: calculateEconomics(20),
      lore: {
        nodeCount: lore.nodes.length,
        relationCount: lore.relations.length,
        orphanIds: lore.orphanIds,
      },
    };
  }),

  lore: protectedProcedure.query(async () => getLiveLoreGraph()),

  artifact: protectedProcedure.input(z.object({ compositionId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const artifact = await getCompositionArtifactForUser(input.compositionId, ctx.user.id);
    if (!artifact) throw new TRPCError({ code: "NOT_FOUND", message: "Artefacto operativo no encontrado" });
    return artifact;
  }),

  setKillSwitch: protectedProcedure.input(z.object({ status: governanceSchema.shape.status })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Solo un administrador puede modificar el kill-switch" });
    return setOrganismControl("governance", {
      ...DEFAULT_GOVERNANCE,
      status: input.status,
      updatedBy: ctx.user.id,
      updatedAt: new Date().toISOString(),
    });
  }),
});
