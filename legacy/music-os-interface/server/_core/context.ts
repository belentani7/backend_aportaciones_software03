import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function isLocalDesktopRequest(req: CreateExpressContextOptions["req"]) {
  if (process.env.MUSIC_OS_DESKTOP !== "1") return false;
  const host = req.hostname;
  const remoteAddress = req.socket.remoteAddress ?? "";
  return host === "127.0.0.1" || host === "localhost" || host === "[::1]" || remoteAddress === "127.0.0.1" || remoteAddress === "::1" || remoteAddress === "::ffff:127.0.0.1";
}

function createDesktopUser(): User {
  const now = new Date();
  return {
    id: 0,
    openId: "music-os-local-desktop",
    name: "MUSIC OS Local",
    email: "local@music-os.invalid",
    loginMethod: "desktop-local",
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = isLocalDesktopRequest(opts.req) ? createDesktopUser() : null;

  if (user) {
    return { req: opts.req, res: opts.res, user };
  }

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
