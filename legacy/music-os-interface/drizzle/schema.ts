import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * One immutable snapshot of a generated Music IR. Every read and write is
 * scoped to the authenticated user in server/db.ts.
 */
export const compositions = mysqlTable(
  "compositions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    musicIrJson: text("musicIrJson").notNull(),
    provider: varchar("provider", { length: 32 }).notNull().default("local"),
    model: varchar("model", { length: 128 }).notNull().default("deterministic-kernel"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userCreatedIdx: index("compositions_user_created_idx").on(table.userId, table.createdAt),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Composition = typeof compositions.$inferSelect;
export type InsertComposition = typeof compositions.$inferInsert;

export const musicalGenomes = mysqlTable("musical_genomes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  baseKey: varchar("baseKey", { length: 32 }).notNull(),
  slotsJson: text("slotsJson").notNull(),
  negative: text("negative").notNull(),
  cfg: varchar("cfg", { length: 32 }).notNull(),
  steps: int("steps").notNull(),
  loraWeightsJson: text("loraWeightsJson").notNull(),
  seed: int("seed").notNull(),
  fitness: varchar("fitness", { length: 32 }).notNull().default("0"),
  lineageJson: text("lineageJson").notNull(),
  qaScore: varchar("qaScore", { length: 32 }),
  noveltyScore: varchar("noveltyScore", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const loraCheckpoints = mysqlTable("lora_checkpoints", {
  id: varchar("id", { length: 64 }).primaryKey(),
  parentId: varchar("parentId", { length: 64 }),
  checksum: varchar("checksum", { length: 128 }).notNull(),
  fidelity: varchar("fidelity", { length: 32 }).notNull(),
  vendiScore: varchar("vendiScore", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["active", "rolled_back", "candidate"]).default("candidate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const loreNodes = mysqlTable("lore_nodes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  kind: mysqlEnum("kind", ["faction", "character", "symbol", "place", "event"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  season: int("season").notNull().default(1),
  embeddingJson: text("embeddingJson").notNull(),
  degree: int("degree").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const loreRelations = mysqlTable("lore_relations", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: varchar("sourceId", { length: 64 }).notNull(),
  targetId: varchar("targetId", { length: 64 }).notNull(),
  relationType: varchar("relationType", { length: 64 }).notNull(),
});

/**
 * Append-only operational record emitted by the actual composition pipeline.
 * A row is created only after a composition is persisted, so provenance can
 * reference the immutable composition id instead of a frontend placeholder.
 */
export const compositionArtifacts = mysqlTable(
  "composition_artifacts",
  {
    id: int("id").autoincrement().primaryKey(),
    compositionId: int("compositionId").notNull().unique(),
    userId: int("userId").notNull(),
    genomeId: varchar("genomeId", { length: 64 }).notNull(),
    checksum: varchar("checksum", { length: 128 }).notNull(),
    provenanceJson: text("provenanceJson").notNull(),
    loreNodeIdsJson: text("loreNodeIdsJson").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    artifactUserCreatedIdx: index("composition_artifacts_user_created_idx").on(table.userId, table.createdAt),
  }),
);

/** Persistent control-plane state for the autonomous machine. */
export const organismControls = mysqlTable("organism_controls", {
  key: varchar("key", { length: 64 }).primaryKey(),
  valueJson: text("valueJson").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MusicalGenomeRow = typeof musicalGenomes.$inferSelect;
export type LoraCheckpointRow = typeof loraCheckpoints.$inferSelect;
export type LoreNodeRow = typeof loreNodes.$inferSelect;
export type LoreRelationRow = typeof loreRelations.$inferSelect;
export type CompositionArtifactRow = typeof compositionArtifacts.$inferSelect;
export type OrganismControlRow = typeof organismControls.$inferSelect;
