"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Marketing pages are static, so they cannot know who is signed in when they
 * render. This swaps the call to action for signed-in visitors after load,
 * using the locally stored session (no network round trip).
 */
export function AccountCta({
  className,
  signedOutHref,
  signedOutLabel,
}: {
  className?: string;
  signedOutHref: string;
  signedOutLabel: string;
}) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!cancelled) setSignedIn(Boolean(data.session));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return signedIn ? (
    <a className={className} href="/portfolios">
      Your portfolios
    </a>
  ) : (
    <a className={className} href={signedOutHref}>
      {signedOutLabel}
    </a>
  );
}
