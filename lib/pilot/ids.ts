import { createHash } from "node:crypto";

/** Deterministic UUID so pilot catalog IDs stay stable across deploys. */
export function pilotUuid(seed: string): string {
  const hash = createHash("sha1").update(`localschoice-pilot:${seed}`).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function isPilotCommunityId(communityId: string): boolean {
  return communityId.startsWith("pilot-");
}
