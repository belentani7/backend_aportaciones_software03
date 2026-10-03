import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import fs from "node:fs/promises";
import path from "node:path";
import {
  compositionArtifacts,
  compositions,
  loreNodes,
  loreRelations,
  musicalGenomes,
  organismControls,
  type Composition,
  type InsertComposition,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

function isDesktopLocalStore() {
  return process.env.MUSIC_OS_DESKTOP === "1" && !process.env.DATABASE_URL;
}

function localCompositionsPath() {
  const root = process.env.MUSIC_OS_LOCAL_DATA_DIR ?? path.resolve(process.cwd(), ".music-os-data");
  return path.join(root, "compositions.json");
}

async function readLocalCompositions(): Promise<Composition[]> {
  try {
    const raw = await fs.readFile(localCompositionsPath(), "utf8");
    const rows = JSON.parse(raw) as Array<Omit<Composition, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string }>;
    return rows.map(row => ({ ...row, createdAt: new Date(row.createdAt), updatedAt: new Date(row.updatedAt) }));
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocalCompositions(rows: Composition[]) {
  const target = localCompositionsPath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(rows, null, 2), "utf8");
}

export type PersistedGenome = {
  id: string;
  base: string;
  slots: Record<string, string>;
  negative: string;
  cfg: number;
  steps: number;
  loraWeights: Record<string, number>;
  seed: number;
  fitness: number;
  lineage: string[];
  qaScore?: number;
  noveltyScore?: number;
};

export type CompositionArtifactInput = {
  compositionId: number;
  userId: number;
  genome: PersistedGenome;
  checksum: string;
  provenance: unknown;
  loreNodeIds: string[];
};

type LocalArtifact = CompositionArtifactInput & { createdAt: string };

function localArtifactsPath() {
  const root = process.env.MUSIC_OS_LOCAL_DATA_DIR ?? path.resolve(process.cwd(), ".music-os-data");
  return path.join(root, "composition-artifacts.json");
}

async function readLocalArtifacts(): Promise<LocalArtifact[]> {
  try {
    return JSON.parse(await fs.readFile(localArtifactsPath(), "utf8")) as LocalArtifact[];
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocalArtifacts(rows: LocalArtifact[]) {
  const target = localArtifactsPath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(rows, null, 2), "utf8");
}

type LocalLoreNode = { id: string; kind: "faction" | "character" | "symbol" | "place" | "event"; name: string; description: string; season: number; embeddingJson: string; degree: number };

const canonicalLoreSeeds: LocalLoreNode[] = [
  { id: "fac_mycelium", kind: "faction", name: "Mycelium Chrome", description: "Facción orgánica-sintética de subgraves y texturas modulares.", season: 1, embeddingJson: "[0.12,0.88,0.45]", degree: 1 },
  { id: "fac_neon", kind: "faction", name: "Neon Syndicate", description: "Facción de pulsos analógicos, ritmo motorik y sintetizadores luminosos.", season: 1, embeddingJson: "[0.85,0.15,0.70]", degree: 1 },
  { id: "sym_subbass", kind: "symbol", name: "Sub-Armónico Sagrado", description: "Símbolo de resonancia grave que enlaza ambos universos sonoros.", season: 1, embeddingJson: "[0.50,0.50,0.90]", degree: 2 },
];

function localLorePath() {
  const root = process.env.MUSIC_OS_LOCAL_DATA_DIR ?? path.resolve(process.cwd(), ".music-os-data");
  return path.join(root, "lore.json");
}

async function readLocalLore(): Promise<LocalLoreNode[]> {
  try {
    return JSON.parse(await fs.readFile(localLorePath(), "utf8")) as LocalLoreNode[];
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocalLore(nodes: LocalLoreNode[]) {
  const target = localLorePath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(nodes, null, 2), "utf8");
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    values.lastSignedIn ??= new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createComposition(input: InsertComposition) {
  if (isDesktopLocalStore()) {
    const rows = await readLocalCompositions();
    const now = new Date();
    const row: Composition = {
      id: rows.reduce((max, item) => Math.max(max, item.id), 0) + 1,
      userId: input.userId,
      title: input.title,
      musicIrJson: input.musicIrJson,
      provider: input.provider ?? "local",
      model: input.model ?? "deterministic-kernel",
      createdAt: now,
      updatedAt: now,
    };
    await writeLocalCompositions([row, ...rows]);
    return row;
  }

  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(compositions).values(input);
  const id = Number(result[0]?.insertId ?? 0);
  if (!id) return undefined;
  return getCompositionForUser(id, input.userId);
}

export async function listCompositionsForUser(userId: number) {
  if (isDesktopLocalStore()) {
    const rows = await readLocalCompositions();
    return rows.filter(row => row.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const db = await getDb();
  if (!db) return [];
  return db.select().from(compositions).where(eq(compositions.userId, userId)).orderBy(desc(compositions.createdAt));
}

export async function getCompositionForUser(id: number, userId: number) {
  if (isDesktopLocalStore()) {
    const rows = await readLocalCompositions();
    return rows.find(row => row.id === id && row.userId === userId);
  }

  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(compositions).where(and(eq(compositions.id, id), eq(compositions.userId, userId))).limit(1);
  return result[0];
}

/**
 * The artifact is written only after the composition receives a persisted id.
 * This guarantees provenance belongs to a real output of the pipeline rather
 * than a temporary frontend object.
 */
export async function persistCompositionArtifact(input: CompositionArtifactInput) {
  if (isDesktopLocalStore()) {
    const current = await readLocalArtifacts();
    const next: LocalArtifact = { ...input, createdAt: new Date().toISOString() };
    await writeLocalArtifacts([next, ...current.filter(row => row.compositionId !== input.compositionId)]);
    return next;
  }

  const db = await getDb();
  if (!db) return undefined;

  await db.insert(musicalGenomes).values({
    id: input.genome.id,
    userId: input.userId,
    baseKey: input.genome.base,
    slotsJson: JSON.stringify(input.genome.slots),
    negative: input.genome.negative,
    cfg: String(input.genome.cfg),
    steps: input.genome.steps,
    loraWeightsJson: JSON.stringify(input.genome.loraWeights),
    seed: input.genome.seed,
    fitness: String(input.genome.fitness),
    lineageJson: JSON.stringify(input.genome.lineage),
    qaScore: input.genome.qaScore === undefined ? null : String(input.genome.qaScore),
    noveltyScore: input.genome.noveltyScore === undefined ? null : String(input.genome.noveltyScore),
  }).onDuplicateKeyUpdate({
    set: {
      fitness: String(input.genome.fitness),
      qaScore: input.genome.qaScore === undefined ? null : String(input.genome.qaScore),
      noveltyScore: input.genome.noveltyScore === undefined ? null : String(input.genome.noveltyScore),
    },
  });

  await db.insert(compositionArtifacts).values({
    compositionId: input.compositionId,
    userId: input.userId,
    genomeId: input.genome.id,
    checksum: input.checksum,
    provenanceJson: JSON.stringify(input.provenance),
    loreNodeIdsJson: JSON.stringify(input.loreNodeIds),
  }).onDuplicateKeyUpdate({
    set: {
      checksum: input.checksum,
      provenanceJson: JSON.stringify(input.provenance),
      loreNodeIdsJson: JSON.stringify(input.loreNodeIds),
    },
  });

  return getCompositionArtifactForUser(input.compositionId, input.userId);
}

export async function getCompositionArtifactForUser(compositionId: number, userId: number) {
  if (isDesktopLocalStore()) {
    return (await readLocalArtifacts()).find(row => row.compositionId === compositionId && row.userId === userId);
  }
  const db = await getDb();
  if (!db) return undefined;
  const row = (await db.select().from(compositionArtifacts).where(and(eq(compositionArtifacts.compositionId, compositionId), eq(compositionArtifacts.userId, userId))).limit(1))[0];
  if (!row) return undefined;
  return { ...row, provenance: JSON.parse(row.provenanceJson), loreNodeIds: JSON.parse(row.loreNodeIdsJson) as string[] };
}

export async function getLiveLoreGraph() {
  const db = await getDb();
  if (!db) return { nodes: [], relations: [], orphanIds: [] as string[] };
  const [nodes, relations] = await Promise.all([db.select().from(loreNodes), db.select().from(loreRelations)]);
  const linked = new Set<string>();
  relations.forEach(relation => { linked.add(relation.sourceId); linked.add(relation.targetId); });
  return { nodes, relations, orphanIds: nodes.filter(node => !linked.has(node.id)).map(node => node.id) };
}

/** Creates the minimal canonical lore only once, then all later reads use DB
 * records. It is intentionally idempotent for retries and scheduled jobs. */
export async function ensureOperationalLore() {
  if (isDesktopLocalStore()) {
    const current = await readLocalLore();
    if (current.length) return current;
    await writeLocalLore(canonicalLoreSeeds);
    return canonicalLoreSeeds;
  }
  const db = await getDb();
  if (!db) return [];
  const current = await db.select().from(loreNodes);
  if (current.length > 0) return current;

  await db.insert(loreNodes).values(canonicalLoreSeeds);
  await db.insert(loreRelations).values([
    { sourceId: "fac_mycelium", targetId: "sym_subbass", relationType: "DEPICTS" },
    { sourceId: "fac_neon", targetId: "sym_subbass", relationType: "DEPICTS" },
  ]);
  return db.select().from(loreNodes);
}

export async function getOrganismControl<T>(key: string, fallback: T): Promise<T> {
  const db = await getDb();
  if (!db) return fallback;
  const row = (await db.select().from(organismControls).where(eq(organismControls.key, key)).limit(1))[0];
  if (!row) return fallback;
  try {
    return JSON.parse(row.valueJson) as T;
  } catch {
    return fallback;
  }
}

export async function setOrganismControl<T>(key: string, value: T) {
  const db = await getDb();
  if (!db) return undefined;
  const valueJson = JSON.stringify(value);
  await db.insert(organismControls).values({ key, valueJson }).onDuplicateKeyUpdate({ set: { valueJson } });
  return getOrganismControl(key, value);
}
