"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  // Before hydration the submit handler is not attached, so a click would fall
  // through to a native GET and Supabase would answer "missing email or phone".
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const supabase = createClient();

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      setBusy(false);
      // Never reveal whether an address has an account.
      setMessage(
        error
          ? error.message
          : "If that address has an account, a reset link is on its way."
      );
      return;
    }

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              // Confirmation links carry a PKCE code that has to be exchanged
              // for a session, which is what /auth/callback does.
              emailRedirectTo: `${window.location.origin}/auth/callback?next=/builder`,
            },
          });

    setBusy(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Check your email to confirm it, then sign in.");
      return;
    }

    router.push("/builder");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <a className="brand" href="/">folio<span>blocks</span></a>
        <div>
          <p className="panel-kicker">Cloud workspace</p>
          <h1>
            {mode === "login"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Reset password"}
          </h1>
          <p>Save your profile, portfolio variants, and published links across devices.</p>
        </div>

        <label className="field">
          <span>Email</span>
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        {mode !== "reset" && (
          <label className="field">
            <span>Password</span>
            <input type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
        )}

        {message && <p className="auth-message">{message}</p>}

        <button className="primary-button auth-submit" disabled={busy || !ready}>
          {busy
            ? "Working…"
            : mode === "login"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Send reset link"}
        </button>

        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setMessage("");
          }}
        >
          {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </button>

        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            setMode(mode === "reset" ? "login" : "reset");
            setMessage("");
          }}
        >
          {mode === "reset" ? "Back to sign in" : "Forgot your password?"}
        </button>
      </form>
    </main>
  );
}
