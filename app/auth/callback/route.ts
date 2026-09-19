import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase email links (password recovery and signup confirmation) come back
 * with a PKCE `code` that has to be exchanged for a session before the app can
 * act as the user. Without this route a recovery link drops the visitor on a
 * page with no session and nothing works.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("next") || "/builder";

  // Only ever redirect within this site.
  const safeNext = redirectTo.startsWith("/") && !redirectTo.startsWith("//")
    ? redirectTo
    : "/builder";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=expired_link", url.origin));
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
