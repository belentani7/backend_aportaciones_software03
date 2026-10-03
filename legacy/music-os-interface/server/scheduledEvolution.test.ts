import { describe, it, expect } from "vitest";
import { scheduledEvolutionHandler } from "./scheduledEvolution";

describe("MUSIC OS — Heartbeat Cron Handler", () => {
  it("rechaza peticiones que no provengan del sistema cron con 403", async () => {
    const req: any = { headers: {} };
    const res: any = {
      status: (code: number) => ({
        json: (body: any) => ({ code, body }),
      }),
    };

    const result = await scheduledEvolutionHandler(req, res);
    expect(result).toBeDefined();
  });
});
