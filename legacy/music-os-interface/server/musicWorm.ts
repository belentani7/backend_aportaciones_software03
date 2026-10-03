import crypto from "node:crypto";

export interface ProvenanceRecord {
  pieceId: string;
  checksum: string;
  c2paMetadata: {
    model: string;
    genomeId: string;
    seed: number;
    timestamp: number;
    author: string;
  };
  dagParents: string[];
}

export function generateWormRecord(pieceId: string, model: string, genomeId: string, seed: number, parents: string[] = []): ProvenanceRecord {
  const payload = JSON.stringify({ pieceId, model, genomeId, seed, parents, time: Date.now() });
  const checksum = crypto.createHash("sha256").update(payload).digest("hex");
  return {
    pieceId,
    checksum: `sha256:${checksum}`,
    c2paMetadata: {
      model,
      genomeId,
      seed,
      timestamp: Date.now(),
      author: "MUSIC OS Autonomous Organism",
    },
    dagParents: parents,
  };
}
