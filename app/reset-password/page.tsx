"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // The recovery link is exchanged for a session by /auth/callback, so if there
  // is no session here the link was never followed, or it has expired.
  useEffect(() => {
    let cancelled = false;

    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (cancelled) return;
        setHasSession(Boolean(data.user));
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (password !== confirmation) {
      setMessage("Those passwords do not match.");
      return;
    }

    setBusy(true);
    setMessage("");

    const { error } = await createClient().auth.updateUser({ password });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password updated. Taking you to the builder…");
    router.push("/builder");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <a className="brand" href="/">folio<span>blocks</span></a>
        <div>
          <p className="panel-kicker">Cloud workspace</p>
          <h1>Choose a new password</h1>
          <p>
            {ready && !hasSession
              ? "This reset link is invalid or has expired. Request a new one from the sign-in page."
              : "Pick something you have not used here before."}
          </p>
        </div>

        <label className="field">
          <span>New password</span>
          <input
            type="password"
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Confirm new password</span>
          <input
            type="password"
            minLength={6}
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>

        {message && <p className="auth-message">{message}</p>}

        <button
          className="primary-button auth-submit"
          disabled={busy || !ready || !hasSession}
        >
          {busy ? "Saving…" : "Update password"}
        </button>

        <a className="ghost-button" href="/login">
          Back to sign in
        </a>
      </form>
    </main>
  );
}
