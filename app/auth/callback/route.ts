import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { siteOrigin } from "@/lib/site-url";

/**
 * Behind a proxy, request.url carries the internal bind address rather than the
 * public host, so redirects built from it point somewhere unreachable such as
 * https://localhost:10000. Prefer the forwarded host the proxy supplies.
 */
function resolveOrigin(request: Request): string {
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (!host) return siteOrigin();

  const isLocal = host.startsWith("localhost") || host.startsWith("127.");
  const proto =
    request.headers.get("x-forwarded-proto") || (isLocal ? "http" : "https");

  return `${proto}://${host}`;
}

/**
 * Supabase email links (password recovery and signup confirmation) come back
 * with a PKCE `code` that has to be exchanged for a session before the app can
 * act as the user. Without this route a recovery link drops the visitor on a
 * page with no session and nothing works.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = resolveOrigin(request);
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("next") || "/builder";

  // Only ever redirect within this site.
  const safeNext = redirectTo.startsWith("/") && !redirectTo.startsWith("//")
    ? redirectTo
    : "/builder";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=expired_link", origin));
  }

  return NextResponse.redirect(new URL(safeNext, origin));
}
