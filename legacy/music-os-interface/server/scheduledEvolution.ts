import { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { runNightlyFinetuneSimulation } from "./advancedEngine";

export async function scheduledEvolutionHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    // Ejecutar simulación de evolución nocturna y fine-tune
    const result = await runNightlyFinetuneSimulation(1);
    
    return res.json({
      ok: true,
      taskUid: user.taskUid,
      evolutionResult: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Internal server error during evolution cron",
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
  }
}
