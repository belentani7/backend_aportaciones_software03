import { describe, expect, it } from "vitest";
import { validateRuntimeEnv } from "./env";

describe("validateRuntimeEnv", () => {
  it("acepta desarrollo sin secretos de producción", () => {
    expect(validateRuntimeEnv({ NODE_ENV: "development" }, false)).toEqual({ ok: true, missing: [] });
  });

  it("rechaza producción cuando faltan variables obligatorias", () => {
    expect(() => validateRuntimeEnv({ NODE_ENV: "production" }, true)).toThrow(/JWT_SECRET/);
  });

  it("acepta producción con la configuración mínima", () => {
    expect(validateRuntimeEnv({ NODE_ENV: "production", JWT_SECRET: "secret", VITE_APP_ID: "app", OAUTH_SERVER_URL: "https://oauth.example" }, true)).toEqual({ ok: true, missing: [] });
  });
});
