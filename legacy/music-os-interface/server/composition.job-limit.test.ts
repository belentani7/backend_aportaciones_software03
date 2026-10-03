import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type TestUser = NonNullable<TrpcContext["user"]>;

function context(userId: number): TrpcContext {
  const user: TestUser = {
    id: userId,
    openId: `job-limit-${userId}`,
    email: `job-limit-${userId}@example.com`,
    name: "Job Limit Test",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("composition job capacity", () => {
  it("rejects the 101st queued job", async () => {
    for (let userId = 1; userId <= 100; userId += 1) {
      await appRouter.createCaller(context(userId)).composition.prepare({
        language: "Español",
        styles: ["The Smiths"],
        bpm: 105,
        key: "Am",
        provider: "local",
        model: "deterministic-kernel",
      });
    }

    await expect(
      appRouter.createCaller(context(101)).composition.prepare({
        language: "Español",
        styles: ["The Smiths"],
        bpm: 105,
        key: "Am",
        provider: "local",
        model: "deterministic-kernel",
      }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});
