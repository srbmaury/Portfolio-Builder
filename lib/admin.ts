/**
 * Admin access is granted to a single address configured as ADMIN_EMAIL.
 *
 * ADMIN_EMAIL is deliberately server-only (no NEXT_PUBLIC_ prefix) so the
 * address is never shipped to the browser. When it is unset we fail closed and
 * nobody is treated as an admin.
 */
function normalizeEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined) {
  const admin = normalizeEmail(process.env.ADMIN_EMAIL);
  if (!admin) return false;

  const candidate = normalizeEmail(email);
  return Boolean(candidate) && candidate === admin;
}
