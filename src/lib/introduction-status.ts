export type IntroPartyStatus = "pending" | "accepted" | "rejected";
export type IntroStatus = "pending" | "exchanged" | "rejected";

export const PARTY_STATUSES: IntroPartyStatus[] = ["pending", "accepted", "rejected"];

export function computeIntroStatus(g: IntroPartyStatus, r: IntroPartyStatus): IntroStatus {
  if (g === "rejected" || r === "rejected") return "rejected";
  if (g === "accepted" && r === "accepted") return "exchanged";
  return "pending";
}

export function isPartyStatus(v: unknown): v is IntroPartyStatus {
  return typeof v === "string" && (PARTY_STATUSES as string[]).includes(v);
}
