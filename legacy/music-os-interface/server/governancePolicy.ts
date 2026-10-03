export type GovernanceStatus = "active" | "paused_publishing" | "paused_production" | "total_halt";

export function canProduce(status: GovernanceStatus) {
  return status === "active" || status === "paused_publishing";
}

export function canArchive(status: GovernanceStatus) {
  return status === "active" || status === "paused_production";
}
