import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { JOB_TTL_MS } from "./routers/composition";
import type { TrpcContext } from "./_core/context";

type TestUser = NonNullable<TrpcContext["user"]>;

function context(): TrpcContext {
  const user: TestUser = {
    id: 3001,
    openId: "job-complete-retention",
    email: "job-complete-retention@example.com",
    name: "Job Complete Retention Test",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("completed composition job retention", () => {
  it("removes a completed job after its TTL", async () => {
    vi.useFakeTimers();
    const previousDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const caller = appRouter.createCaller(context());
      const prepared = await caller.composition.prepare({
        language: "Español",
        styles: ["The Smiths"],
        bpm: 105,
        key: "Am",
        provider: "local",
        model: "deterministic-kernel",
      });
      const runPromise = caller.composition.run({ jobId: prepared.jobId });
      await vi.advanceTimersByTimeAsync(1000);
      await runPromise;

      const completed = await caller.composition.status({ jobId: prepared.jobId });
      expect(completed.status).toBe("complete");

      vi.advanceTimersByTime(JOB_TTL_MS + 1);
      await expect(caller.composition.status({ jobId: prepared.jobId })).rejects.toMatchObject({ code: "NOT_FOUND" });
    } finally {
      if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }, 15_000);
});
