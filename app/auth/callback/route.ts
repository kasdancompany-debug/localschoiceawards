import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { sanitizeRedirectPath } from "@/lib/auth/redirects";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = sanitizeRedirectPath(url.searchParams.get("next"), "/account");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
      );
    }

    if (data.user?.id) {
      const { mergeAnonymousCartIntoUser } = await import("@/lib/commerce/cart");
      await mergeAnonymousCartIntoUser({ userId: data.user.id });
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
