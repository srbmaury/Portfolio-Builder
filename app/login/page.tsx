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
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    setReady(true);
    // Sign-out anywhere in the app lands here with ?signed_out=1. Confirm it,
    // then drop the flag so a refresh does not repeat the message.
    const url = new URL(window.location.href);
    if (url.searchParams.get("signed_out") === "1") {
      setSignedOut(true);
      url.searchParams.delete("signed_out");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }, []);

  async function signInWithGoogle() {
    setBusy(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/builder?signed_in=1")}`,
      },
    });

    // A successful browser OAuth call navigates away. If it stays here, show
    // the provider/configuration error instead of leaving the button spinning.
    if (error) {
      setBusy(false);
      setMessage(error.message);
    }
  }

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

    router.push("/builder?signed_in=1");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <a className="brand" href="/">DevFolio<span>X</span></a>
        {signedOut ? (
          <p className="auth-notice" role="status">
            You have been signed out. Your browser draft is still in the builder.
          </p>
        ) : null}
        <div>
          <h1>
            {mode === "login"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Reset password"}
          </h1>
          <p>
            {mode === "reset"
              ? "Enter your email and we will send you a link to set a new password."
              : "Publish your portfolio to a live link and see every open, and where it came from."}
          </p>
        </div>

        {mode !== "reset" && (
          <>
            <button
              type="button"
              className="google-auth-button"
              onClick={signInWithGoogle}
              disabled={busy || !ready}
            >
              <svg
                className="google-auth-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 4.97-.9 6.62-2.4l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.39 13.91A6.02 6.02 0 0 1 6.08 12c0-.66.11-1.3.31-1.91v-2.6H3.04A10 10 0 0 0 2 12c0 1.61.39 3.13 1.04 4.51l3.35-2.6Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.96c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.49l3.35 2.6C7.18 7.72 9.39 5.96 12 5.96Z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="auth-divider" aria-hidden="true">
              <span />
              <small>or continue with email</small>
              <span />
            </div>
          </>
        )}

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
