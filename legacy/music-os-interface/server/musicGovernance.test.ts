import { describe, it, expect } from "vitest";
import { getGovernanceState, setGovernanceStatus, calculateEconomics } from "./musicGovernance";

describe("MUSIC OS — Gobierno, Kill-Switches y Economía", () => {
  it("recupera el estado inicial de gobernanza y constitución", () => {
    const gov = getGovernanceState();
    expect(gov.status).toBe("active");
    expect(gov.constitutionVersion).toBe("v1.0.0-immutable");
    expect(gov.nsfwFilterActive).toBe(true);
  });

  it("permite cambiar el estado del kill-switch jerárquico", () => {
    const updated = setGovernanceStatus("paused_publishing");
    expect(updated.status).toBe("paused_publishing");
    setGovernanceStatus("active"); // restaurar
  });

  it("calcula correctamente la economía y el costo operativo", () => {
    const eco = calculateEconomics(20);
    expect(eco.unitCost).toBe(0.30);
    expect(eco.dailyGenCost).toBe(6.00);
    expect(eco.totalMonthlyCost).toBeGreaterThan(0);
  });
});
