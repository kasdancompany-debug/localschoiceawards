import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  COMMUNITY_SUBDOMAIN_HEADER,
  HOSTNAME_KIND_HEADER,
} from "@/lib/communities/current";
import { parseHostname } from "@/lib/communities/hostname";
import { internalPathForHostnameKind } from "@/lib/communities/resolve-tenant";

function withTenantHeaders(
  request: NextRequest,
  values: { kind: string; subdomain?: string | null },
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(HOSTNAME_KIND_HEADER, values.kind);
  if (values.subdomain) {
    requestHeaders.set(COMMUNITY_SUBDOMAIN_HEADER, values.subdomain);
  } else {
    requestHeaders.delete(COMMUNITY_SUBDOMAIN_HEADER);
  }
  return requestHeaders;
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.getUser();
  }

  const host = request.headers.get("host") ?? "";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
  const parsed = parseHostname(host, rootDomain);
  const rewritePath = internalPathForHostnameKind(parsed.kind, request.nextUrl.pathname);

  const requestHeaders = withTenantHeaders(request, {
    kind: parsed.kind,
    subdomain: parsed.kind === "community" ? parsed.subdomain : null,
  });

  if (!rewritePath) {
    const nextResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });
    copyCookies(response, nextResponse);
    nextResponse.headers.set(HOSTNAME_KIND_HEADER, parsed.kind);
    return nextResponse;
  }

  const url = request.nextUrl.clone();
  url.pathname = rewritePath;

  const rewriteResponse = NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  });
  copyCookies(response, rewriteResponse);
  rewriteResponse.headers.set(HOSTNAME_KIND_HEADER, parsed.kind);
  if (parsed.kind === "community" && parsed.subdomain) {
    rewriteResponse.headers.set(COMMUNITY_SUBDOMAIN_HEADER, parsed.subdomain);
  }
  return rewriteResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\..*).*)"],
};
