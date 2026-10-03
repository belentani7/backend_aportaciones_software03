import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createComposition, ensureOperationalLore, getCompositionArtifactForUser, getCompositionForUser, getOrganismControl, listCompositionsForUser, persistCompositionArtifact } from "../db";
import { generateComposition, renderMidi, SUPPORTED_LANGUAGES, SUPPORTED_PROVIDERS } from "../musicKernel";
import { createRandomGenome, evaluateGenomeQA } from "../musicGenome";
import { generateWormRecord } from "../musicWorm";
import { canArchive, canProduce, type GovernanceStatus } from "../governancePolicy";
import { protectedProcedure, router } from "../_core/trpc";

const generationInput = z.object({
  theme: z.string().trim().max(800).optional(),
  language: z.enum(SUPPORTED_LANGUAGES),
  styles: z.array(z.string().trim().min(1).max(80)).min(1).max(4),
  bpm: z.number().int().min(40).max(240),
  key: z.string().regex(/^[A-G](?:#|b)?m?$/).max(4),
  provider: z.enum(SUPPORTED_PROVIDERS).default("local"),
  model: z.string().trim().max(128).regex(/^[a-zA-Z0-9._:-]+$/).optional(),
});

type GenerationInput = z.infer<typeof generationInput>;
type JobStage = { name: string; status: "complete" | "active" | "pending"; progress: number; message: string };
type JobEvent = { agent: string; action: string; timestamp: string };
type Job = {
  id: string;
  userId: number;
  input: GenerationInput;
  status: "queued" | "running" | "complete" | "error";
  progress: number;
  stages: JobStage[];
  history: JobEvent[];
  createdAt: number;
  result?: { id: number | null; createdAt: Date; musicIr: unknown; midiBase64: string };
  error?: string;
};

const jobs = new Map<string, Job>();
const activeJobByUser = new Map<number, string>();
const stageNames = ["Planner", "Compositor", "Productor", "Evaluador"] as const;
export const MAX_JOB_COUNT = 100;
export const JOB_TTL_MS = 10 * 60 * 1000;

function initialStages(): JobStage[] {
  return stageNames.map(name => ({ name, status: "pending", progress: 0, message: "En espera" }));
}

function timestamp() {
  return new Date().toISOString();
}

function cleanupExpiredJobs(now = Date.now()) {
  for (const [id, job] of Array.from(jobs.entries())) {
    const expired = now - job.createdAt > JOB_TTL_MS;
    const removable = job.status !== "running";
    if (!expired || !removable) continue;
    jobs.delete(id);
    if (activeJobByUser.get(job.userId) === id) activeJobByUser.delete(job.userId);
  }
}

function pushEvent(job: Job, agent: string, action: string) {
  job.history.push({ agent, action, timestamp: timestamp() });
  if (job.history.length > 80) job.history.shift();
}

function updateJobFromKernel(job: Job, update: { stage: string; status: "active" | "complete"; progress: number; message: string }) {
  const stage = job.stages.find(item => item.name === update.stage);
  if (stage) {
    stage.status = update.status;
    stage.progress = update.progress;
    stage.message = update.message;
  }
  job.progress = Math.max(job.progress, update.progress);
  pushEvent(job, update.stage, update.message);
}

async function saveResult(userId: number, musicIr: any, genome = createRandomGenome(musicIr.musical.key)) {
  const governance = await getOrganismControl("governance", { status: "active" });
  if (!canArchive(governance.status as GovernanceStatus)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "La gobernanza bloqueó el archivado de nuevos resultados." });
  }
  // The creative genome is instantiated by the backend at run time, audited
  // against the produced IR, and becomes part of the persisted output.
  const qa = evaluateGenomeQA(genome, musicIr);
  genome.qaScore = qa.qaScore;
  genome.noveltyScore = qa.noveltyScore;
  genome.fitness = Number((qa.qaScore * 0.6 + qa.noveltyScore * 0.4).toFixed(2));
  const loreNodes = await ensureOperationalLore();
  const loreNodeIds = loreNodes
    .filter(node => musicIr.model.provider.includes("local") ? node.id !== "fac_neon" : true)
    .slice(0, 2)
    .map(node => node.id);
  musicIr.organism = {
    genome: {
      id: genome.id,
      base: genome.base,
      slots: genome.slots,
      seed: genome.seed,
      fitness: genome.fitness,
      qaScore: qa.qaScore,
      noveltyScore: qa.noveltyScore,
      passed: qa.passed,
    },
    provenance: null,
    loreNodeIds,
  };
  const saved = await createComposition({
    userId,
    title: musicIr.metadata.title,
    musicIrJson: JSON.stringify(musicIr),
    provider: musicIr.model.provider,
    model: musicIr.model.name,
  });
  const compositionId = saved?.id ?? null;
  if (compositionId !== null) {
    const record = generateWormRecord(`composition:${compositionId}`, musicIr.model.name, genome.id, genome.seed, genome.lineage);
    const artifact = await persistCompositionArtifact({
      compositionId,
      userId,
      genome,
      checksum: record.checksum,
      provenance: record,
      loreNodeIds,
    });
    musicIr.organism.provenance = artifact?.provenance ?? record;
  }
  return {
    id: saved?.id ?? null,
    createdAt: saved?.createdAt ?? new Date(),
    musicIr,
    midiBase64: renderMidi(musicIr).toString("base64"),
  };
}

async function runJob(job: Job) {
  job.status = "running";
  pushEvent(job, "Sistema", "Job aceptado; Event Bus conectado.");
  try {
    const genome = createRandomGenome(job.input.key);
    const musicIr = await generateComposition({
      ...job.input,
      genome,
      onProgress: update => updateJobFromKernel(job, update),
    });
    job.result = await saveResult(job.userId, musicIr, genome);
    job.status = "complete";
    job.progress = 100;
    for (const stage of job.stages) {
      stage.status = "complete";
      stage.progress = Math.max(stage.progress, 100);
    }
    pushEvent(job, "Sistema", "Music IR persistido y exportadores preparados.");
  } catch (error) {
    job.status = "error";
    job.error = error instanceof Error ? error.message : "Error desconocido del pipeline";
    pushEvent(job, "Sistema", `Pipeline detenido: ${job.error}`);
  } finally {
    if (activeJobByUser.get(job.userId) === job.id) activeJobByUser.delete(job.userId);
    const cleanupTimer = setTimeout(() => {
      jobs.delete(job.id);
      if (activeJobByUser.get(job.userId) === job.id) activeJobByUser.delete(job.userId);
    }, JOB_TTL_MS);
    cleanupTimer.unref?.();
  }
}

const parseMusicIr = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Music IR persistido no válido" });
  }
};

export const compositionRouter = router({
  prepare: protectedProcedure.input(generationInput).mutation(({ ctx, input }) => {
    cleanupExpiredJobs();
    if (jobs.size >= MAX_JOB_COUNT) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Capacidad temporal de jobs agotada; inténtalo de nuevo en unos minutos." });
    }
    const currentId = activeJobByUser.get(ctx.user.id);
    const current = currentId ? jobs.get(currentId) : undefined;
    if (current && (current.status === "queued" || current.status === "running")) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Ya hay una composición en ejecución para este usuario." });
    }
    const id = nanoid(12);
    const job: Job = { id, userId: ctx.user.id, input, status: "queued", progress: 0, stages: initialStages(), history: [], createdAt: Date.now() };
    jobs.set(id, job);
    activeJobByUser.set(ctx.user.id, id);
    pushEvent(job, "Sistema", "Job preparado; esperando ejecución del pipeline.");
    return { jobId: id, status: job.status, progress: job.progress, stages: job.stages, history: job.history };
  }),

  run: protectedProcedure.input(z.object({ jobId: z.string().min(8).max(32) })).mutation(async ({ ctx, input }) => {
    cleanupExpiredJobs();
    const governance = await getOrganismControl("governance", { status: "active" });
    if (!canProduce(governance.status as GovernanceStatus)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "La producción está pausada por el kill-switch operativo." });
    }
    const job = jobs.get(input.jobId);
    if (!job || job.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Job no encontrado" });
    if (job.status !== "queued") throw new TRPCError({ code: "CONFLICT", message: "El job ya fue ejecutado" });
    await runJob(job);
    if (job.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: job.error });
    return job.result;
  }),

  status: protectedProcedure.input(z.object({ jobId: z.string().min(8).max(32) })).query(({ ctx, input }) => {
    cleanupExpiredJobs();
    const job = jobs.get(input.jobId);
    if (!job || job.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Job no encontrado" });
    return { jobId: job.id, status: job.status, progress: job.progress, stages: job.stages, history: job.history, error: job.error ?? null, result: job.status === "complete" ? job.result : null };
  }),

  // Compatibility endpoint for clients that still expect a single mutation.
  generate: protectedProcedure.input(generationInput).mutation(async ({ ctx, input }) => {
    const governance = await getOrganismControl("governance", { status: "active" });
    if (!canProduce(governance.status as GovernanceStatus)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "La producción está pausada por el kill-switch operativo." });
    }
    const genome = createRandomGenome(input.key);
    const musicIr = await generateComposition({ ...input, genome });
    return saveResult(ctx.user.id, musicIr, genome);
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await listCompositionsForUser(ctx.user.id);
    return rows.map(row => ({ id: row.id, title: row.title, provider: row.provider, model: row.model, createdAt: row.createdAt, musicIr: parseMusicIr(row.musicIrJson) }));
  }),

  get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const row = await getCompositionForUser(input.id, ctx.user.id);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Composición no encontrada" });
    const musicIr = parseMusicIr(row.musicIrJson);
    const artifact = await getCompositionArtifactForUser(row.id, ctx.user.id);
    return { id: row.id, title: row.title, provider: row.provider, model: row.model, createdAt: row.createdAt, musicIr, artifact: artifact ?? null, midiBase64: renderMidi(musicIr).toString("base64") };
  }),
});
