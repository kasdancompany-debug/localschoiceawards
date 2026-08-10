"use client";

import posthog from "posthog-js";

import { clientEnv } from "@/lib/env/client";

let initialized = false;

export function initPostHogBrowser(): void {
  if (initialized || typeof window === "undefined") {
    return;
  }

  const key = clientEnv.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    return;
  }

  posthog.init(key, {
    api_host: clientEnv.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
  });

  initialized = true;
}

export { posthog };
