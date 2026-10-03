import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { pathToFileURL } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { validateRuntimeEnv } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

export async function startServer(options: { preferredPort?: number; host?: string } = {}) {
  validateRuntimeEnv();
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Heartbeat cron handler for autonomous evolution
  app.post("/api/scheduled/evolution", (req, res) => {
    import("../scheduledEvolution").then(mod => mod.scheduledEvolutionHandler(req, res));
  });
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = options.preferredPort ?? parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, options.host, () => resolve());
  });
  console.log(`Server running on http://localhost:${port}/`);
  return { server, port };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  startServer().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
