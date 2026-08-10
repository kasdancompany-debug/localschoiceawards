import { createHash, randomBytes } from "node:crypto";

/** Server-issued cart token — never use localStorage as source of truth. */
export function createCartToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashCartToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
