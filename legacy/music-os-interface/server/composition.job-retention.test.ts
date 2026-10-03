import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { JOB_TTL_MS } from "./routers/composition";
import type { TrpcContext } from "./_core/context";

type TestUser = NonNullable<TrpcContext["user"]>;

function context(userId: number): TrpcContext {
  const user: TestUser = {
    id: userId,
    openId: `job-retention-${userId}`,
    email: `job-retention-${userId}@example.com`,
    name: "Job Retention Test",
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

describe("composition job retention", () => {
  it("expires a queued job and frees its user slot", async () => {
    vi.useFakeTimers();
    const caller = appRouter.createCaller(context(2001));
    const prepared = await caller.composition.prepare({
      language: "Español",
      styles: ["The Smiths"],
      bpm: 105,
      key: "Am",
      provider: "local",
      model: "deterministic-kernel",
    });

    vi.advanceTimersByTime(JOB_TTL_MS + 1);
    await expect(caller.composition.status({ jobId: prepared.jobId })).rejects.toMatchObject({ code: "NOT_FOUND" });

    const replacement = await caller.composition.prepare({
      language: "Español",
      styles: ["The Smiths"],
      bpm: 105,
      key: "Am",
      provider: "local",
      model: "deterministic-kernel",
    });
    expect(replacement.status).toBe("queued");
  });
});
