import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./musicKernel", () => ({
  SUPPORTED_LANGUAGES: ["Español"],
  SUPPORTED_PROVIDERS: ["local"],
  generateComposition: vi.fn().mockRejectedValue(new Error("forced test failure")),
  renderMidi: vi.fn(),
}));

import { appRouter } from "./routers";
import { JOB_TTL_MS } from "./routers/composition";
import type { TrpcContext } from "./_core/context";

type TestUser = NonNullable<TrpcContext["user"]>;

function context(): TrpcContext {
  const user: TestUser = {
    id: 4001,
    openId: "job-error-retention",
    email: "job-error-retention@example.com",
    name: "Job Error Retention Test",
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

describe("failed composition job retention", () => {
  it("removes a failed job after its TTL", async () => {
    vi.useFakeTimers();
    const caller = appRouter.createCaller(context());
    const prepared = await caller.composition.prepare({
      language: "Español",
      styles: ["The Smiths"],
      bpm: 105,
      key: "Am",
      provider: "local",
      model: "deterministic-kernel",
    });

    await expect(caller.composition.run({ jobId: prepared.jobId })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect((await caller.composition.status({ jobId: prepared.jobId })).status).toBe("error");

    vi.advanceTimersByTime(JOB_TTL_MS + 1);
    await expect(caller.composition.status({ jobId: prepared.jobId })).rejects.toMatchObject({ code: "NOT_FOUND" });
  }, 10_000);
});
