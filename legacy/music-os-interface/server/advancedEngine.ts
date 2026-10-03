import crypto from "node:crypto";
import { getDb } from "./db";
import { loraCheckpoints, loreNodes, loreRelations, musicalGenomes } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export interface Genome {
  id: string;
  baseKey: string;
  slots: {
    style: string;
    rhythm: string;
    harmony: string;
    instrumentation: string;
    mood: string;
    era: string;
  };
  negative: string;
  cfg: number;
  steps: number;
  loraWeights: Record<string, number>;
  seed: number;
  fitness: number;
  lineage: string[];
  qaScore?: number;
  noveltyScore?: number;
}

// 1. Validación estricta sin colisión armónica
const HARMONY_KEY_COMPATIBILITY: Record<string, string[]> = {
  "Am": ["Modal Jazz", "Dark Minor", "Suspended 4ths"],
  "C": ["Suspended 4ths", "Modal Jazz"],
  "Dm": ["Dark Minor", "Modal Jazz"],
  "G": ["Suspended 4ths", "Modal Jazz"],
};

export function validateHarmonicCollision(baseKey: string, harmony: string): boolean {
  const allowed = HARMONY_KEY_COMPATIBILITY[baseKey];
  if (!allowed) return true; // por defecto tolerante
  return allowed.includes(harmony);
}

export function evaluateFinetuneRollback(candidate: { fidelity: number; diversity: number }, baseline = { fidelity: 0.92, diversity: 0.85 }) {
  if (candidate.diversity < baseline.diversity * 0.95) return { rollback: true, reason: "COLLAPSE_RISK" as const };
  if (candidate.fidelity < baseline.fidelity * 0.90) return { rollback: true, reason: "DRIFT" as const };
  return { rollback: false, reason: "APPROVED" as const };
}

// 2. Bucle de auto-entrenamiento con ratio estricto y rollback automático
export async function runNightlyFinetuneSimulation(userId: number): Promise<{ success: boolean; message: string; checkpointId?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database unavailable" };

  const ANCHOR_RATIO = 0.70;
  const SELF_GEN_RATIO = 0.30;

  const baselineFidelity = 0.92;
  const baselineVendi = 0.85;

  const newFidelity = Number((Math.random() * 0.1 + 0.88).toFixed(2));
  const newVendi = Number((Math.random() * 0.1 + 0.82).toFixed(2));

  const checkpointId = `lora_${crypto.randomBytes(4).toString("hex")}`;
  const checksum = crypto.createHash("sha256").update(checkpointId).digest("hex");
  const decision = evaluateFinetuneRollback({ fidelity: newFidelity, diversity: newVendi }, { fidelity: baselineFidelity, diversity: baselineVendi });

  if (decision.reason === "COLLAPSE_RISK") {
    await db.insert(loraCheckpoints).values({
      id: checkpointId,
      parentId: "lora_baseline",
      checksum,
      fidelity: String(newFidelity),
      vendiScore: String(newVendi),
      status: "rolled_back",
    });
    return { success: false, message: "COLLAPSE_RISK: diversidad en caída (>5%). Rollback aplicado.", checkpointId };
  }

  if (decision.reason === "DRIFT") {
    await db.insert(loraCheckpoints).values({
      id: checkpointId,
      parentId: "lora_baseline",
      checksum,
      fidelity: String(newFidelity),
      vendiScore: String(newVendi),
      status: "rolled_back",
    });
    return { success: false, message: "DRIFT: el estilo se alejó del canon. Rollback aplicado.", checkpointId };
  }

  await db.insert(loraCheckpoints).values({
    id: checkpointId,
    parentId: "lora_baseline",
    checksum,
    fidelity: String(newFidelity),
    vendiScore: String(newVendi),
    status: "active",
  });

  return { success: true, message: `Fine-tune exitoso. Checkpoint ${checkpointId} activado (Ancla: ${ANCHOR_RATIO * 100}%, Self: ${SELF_GEN_RATIO * 100}%).`, checkpointId };
}

export async function getLoreGraphData() {
  const db = await getDb();
  if (!db) return { nodes: [], relations: [], orphansCount: 0 };

  const nodes = await db.select().from(loreNodes);
  const relations = await db.select().from(loreRelations);

  const connectedIds = new Set<string>();
  for (const r of relations) {
    connectedIds.add(r.sourceId);
    connectedIds.add(r.targetId);
  }
  const orphans = nodes.filter((n: { id: string }) => !connectedIds.has(n.id));

  return {
    nodes,
    relations,
    orphansCount: orphans.length,
  };
}
