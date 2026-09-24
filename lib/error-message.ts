/**
 * Supabase returns errors as plain objects ({ code, message }), not Error
 * instances, so `error instanceof Error` checks fall through to a generic
 * fallback and hide the real reason. Read the message from either shape.
 */
export function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const { code, message } = error as { code?: unknown; message?: unknown };
    if (code === "23505") {
      return "Some of this content has the same ID as content already saved by another account. Reload the demo or re-add the affected items, then save again.";
    }
    if (typeof message === "string" && message.trim()) return message;
  }
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}
