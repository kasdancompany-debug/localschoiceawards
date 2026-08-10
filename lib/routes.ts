import type { Route } from "next";

/**
 * Narrow dynamic/auth redirect targets for Next.js typed routes.
 * Only pass application-relative paths that have already been sanitized.
 */
export function toRoute(path: string): Route {
  return path as Route;
}
