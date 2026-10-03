export interface LoreNode {
  id: string;
  kind: "faction" | "character" | "symbol" | "place" | "event";
  name: string;
  description: string;
  season: number;
  embeddingVector: number[]; // Simulado para relaciones vectoriales
  createdAt: number;
  degree: number;
}

export interface LoreRelation {
  sourceId: string;
  targetId: string;
  relationType: "BELONGS_TO" | "RIVALS" | "ALLIED_WITH" | "DEPICTS" | "APPEARS_IN" | "INTRODUCES";
}

export const INITIAL_LORE_GRAPH: { nodes: LoreNode[]; relations: LoreRelation[] } = {
  nodes: [
    {
      id: "fac_mycelium",
      kind: "faction",
      name: "Mycelium Chrome",
      description: "Facción orgánica-sintética que fusiona biotecnología con frecuencias sub-graves.",
      season: 1,
      embeddingVector: [0.12, 0.88, 0.45],
      createdAt: Date.now() - 86400000 * 30,
      degree: 5,
    },
    {
      id: "fac_neon",
      kind: "faction",
      name: "Neon Syndicate",
      description: "Guardianes de los sintetizadores analógicos y la estética retro-futurista.",
      season: 1,
      embeddingVector: [0.85, 0.15, 0.70],
      createdAt: Date.now() - 86400000 * 30,
      degree: 4,
    },
    {
      id: "sym_subbass",
      kind: "symbol",
      name: "El Sub-Armónico Sagrado",
      description: "Frecuencia fundacional capaz de resonar en la memoria colectiva del sistema.",
      season: 1,
      embeddingVector: [0.50, 0.50, 0.90],
      createdAt: Date.now() - 86400000 * 20,
      degree: 6,
    },
    {
      id: "plc_underground",
      kind: "place",
      name: "Catacumbas de Silicio",
      description: "Laboratorio acústico profundo donde se almacenan los respaldos MIDI históricos.",
      season: 1,
      embeddingVector: [0.20, 0.30, 0.10],
      createdAt: Date.now() - 86400000 * 25,
      degree: 3,
    },
  ],
  relations: [
    { sourceId: "fac_mycelium", targetId: "sym_subbass", relationType: "DEPICTS" },
    { sourceId: "fac_neon", targetId: "plc_underground", relationType: "DEPICTS" },
    { sourceId: "fac_mycelium", targetId: "fac_neon", relationType: "RIVALS" },
  ],
};

export function findOrphanNodes(nodes: LoreNode[], relations: LoreRelation[]): LoreNode[] {
  const connectedIds = new Set<string>();
  for (const r of relations) {
    connectedIds.add(r.sourceId);
    connectedIds.add(r.targetId);
  }
  return nodes.filter(n => !connectedIds.has(n.id));
}

export function suggestCrossover(nodes: LoreNode[], relations: LoreRelation[]): { factionA: string; factionB: string; sharedSymbol: string }[] {
  // Simula la consulta de facciones que comparten símbolos pero no tienen relación directa
  return [
    {
      factionA: "Mycelium Chrome",
      factionB: "Neon Syndicate",
      sharedSymbol: "El Sub-Armónico Sagrado",
    },
  ];
}
