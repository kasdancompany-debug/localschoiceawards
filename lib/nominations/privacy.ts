import { createHash } from "node:crypto";

/** One-way hash for privacy-conscious storage (email / IP fingerprints). */
export function hashPrivacyValue(value: string, salt = "locals-choice"): string {
  return createHash("sha256")
    .update(`${salt}:${value.trim().toLowerCase()}`)
    .digest("hex");
}

export function hashVerifiedEmail(email: string): string {
  return hashPrivacyValue(email, "nomination-email");
}

export function hashIpFingerprint(ip: string): string {
  return hashPrivacyValue(ip, "nomination-ip");
}
