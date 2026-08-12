"use client";

import { useEffect } from "react";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

type BusinessEngagementTrackerProps = {
  businessId: string;
  communityId?: string | null;
  businessLocationId?: string | null;
};

async function postEvent(payload: Record<string, unknown>) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Ignore analytics network errors.
  }
}

export function BusinessEngagementTracker({
  businessId,
  communityId,
  businessLocationId,
}: BusinessEngagementTrackerProps) {
  useEffect(() => {
    void postEvent({
      eventName: ANALYTICS_EVENTS.businessProfileView,
      businessId,
      communityId,
      businessLocationId,
    });
  }, [businessId, communityId, businessLocationId]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[data-analytics]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const kind = anchor.dataset.analytics;
      const eventName =
        kind === "website"
          ? ANALYTICS_EVENTS.businessWebsiteClick
          : kind === "phone"
            ? ANALYTICS_EVENTS.businessPhoneClick
            : kind === "directions"
              ? ANALYTICS_EVENTS.businessDirectionClick
              : kind === "nominate"
                ? ANALYTICS_EVENTS.businessNominationLinkClick
                : kind === "vote"
                  ? ANALYTICS_EVENTS.businessVotingLinkClick
                  : null;
      if (!eventName) return;
      void postEvent({
        eventName,
        businessId,
        communityId,
        businessLocationId,
      });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [businessId, communityId, businessLocationId]);

  return null;
}
