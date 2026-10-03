import { describe, it, expect } from "vitest";
import { generateWormRecord } from "./musicWorm";

describe("MUSIC OS — Archivo WORM y Provenencia C2PA", () => {
  it("genera un registro WORM inmutable con checksum SHA-256 y metadatos C2PA", () => {
    const record = generateWormRecord("p_16842", "deterministic-kernel", "g_123", 42, ["p_16800"]);
    expect(record.checksum).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(record.c2paMetadata.seed).toBe(42);
    expect(record.dagParents).toContain("p_16800");
  });
});
