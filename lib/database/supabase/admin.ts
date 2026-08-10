import "server-only";

import { createClient } from "@supabase/supabase-js";

import { assertServerOnly, env } from "@/lib/env/server";
import type { Database } from "@/types/database";

/**
 * Service-role client. Never import this module from client components or
 * shared code that can reach the browser bundle.
 */
export function createSupabaseAdminClient() {
  assertServerOnly("createSupabaseAdminClient");

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
