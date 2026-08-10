import "server-only";

import { PostHog } from "posthog-node";

import { env } from "@/lib/env/server";

let posthogClient: PostHog | null = null;

export function getPostHogServerClient(): PostHog | null {
  if (!env.POSTHOG_API_KEY) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(env.POSTHOG_API_KEY, {
      host: env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogClient;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, string | number | boolean | null>,
): Promise<void> {
  const client = getPostHogServerClient();
  if (!client) {
    return;
  }

  client.capture({
    distinctId,
    event,
    properties,
  });

  await client.flush();
}
