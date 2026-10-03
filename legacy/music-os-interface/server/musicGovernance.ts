export type SystemStateStatus = "active" | "paused_publishing" | "paused_production" | "total_halt";

export interface GovernanceState {
  status: SystemStateStatus;
  constitutionVersion: string;
  nsfwFilterActive: boolean;
  costPerPieceEst: number; // en USD
  universes: { id: string; name: string; activeLora: string; centroid: string }[];
}

let currentGovernance: GovernanceState = {
  status: "active",
  constitutionVersion: "v1.0.0-immutable",
  nsfwFilterActive: true,
  costPerPieceEst: 0.30,
  universes: [
    { id: "uni_alpha", name: "Alpha Cyberpunk", activeLora: "lora_cyber_v12", centroid: "c_neon_heavy" },
    { id: "uni_beta", name: "Beta Mycelium", activeLora: "lora_organic_v4", centroid: "c_ambient_sub" },
  ],
};

export function getGovernanceState(): GovernanceState {
  return currentGovernance;
}

export function setGovernanceStatus(status: SystemStateStatus): GovernanceState {
  currentGovernance.status = status;
  return currentGovernance;
}

export function calculateEconomics(piecesProducedToday: number) {
  const unitCost = currentGovernance.costPerPieceEst;
  const dailyGenCost = piecesProducedToday * unitCost;
  const monthlyInfraEst = 650.00;
  const totalMonthlyCost = (piecesProducedToday * 30 * unitCost) + monthlyInfraEst;
  return {
    unitCost,
    dailyGenCost,
    monthlyInfraEst,
    totalMonthlyCost,
    breakevenActiveUsers: 3500,
  };
}
