"use client";

import { useEffect, type ReactNode } from "react";

import { initPostHogBrowser } from "@/lib/analytics/posthog-browser";

type AnalyticsProviderProps = {
  children: ReactNode;
};

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    initPostHogBrowser();
  }, []);

  return children;
}
