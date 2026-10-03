const runtimeEnv = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

export const ENV = runtimeEnv;

const productionRequired = [
  ["JWT_SECRET", "firma de sesiones"],
  ["VITE_APP_ID", "identificador OAuth"],
  ["OAUTH_SERVER_URL", "servidor OAuth"],
] as const;

export function validateRuntimeEnv(
  env: NodeJS.ProcessEnv = process.env,
  isProduction = env.NODE_ENV === "production" && env.MUSIC_OS_DESKTOP !== "1",
) {
  if (!isProduction) return { ok: true as const, missing: [] as string[] };

  const missing = productionRequired
    .filter(([key]) => !env[key]?.trim())
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Configuración de producción incompleta. Faltan variables obligatorias: ${missing.join(", ")}. ` +
        "Configúralas como secretos del entorno antes de iniciar el servidor.",
    );
  }

  return { ok: true as const, missing: [] as string[] };
}
