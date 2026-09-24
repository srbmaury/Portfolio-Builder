/**
 * Tagged share links: `/<user>/<portfolio>?via=linkedin`.
 *
 * Browsers drop the referrer for visits from email apps, PDFs, and chat apps,
 * so those land as "Direct". A tag in the link survives all of them. The tag
 * is stored in the event's referrer_host column as `via:<tag>`, which needs no
 * schema change (the column is free text up to 255 chars) and keeps tagged and
 * untagged sources in one breakdown.
 */

export const SHARE_TAG_PARAM = "via";
export const SHARE_TAG_PREFIX = "via:";

export const SHARE_SOURCES = [
  { tag: "linkedin", label: "LinkedIn" },
  { tag: "resume", label: "Résumé" },
  { tag: "email", label: "Email" },
  { tag: "github", label: "GitHub" },
  { tag: "x", label: "X" },
] as const;

const TAG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

/** Lowercase slug of 1–40 chars, or "" when nothing usable remains. */
export function normalizeShareTag(raw: string | null | undefined) {
  const slug = (raw || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return TAG_RE.test(slug) ? slug : "";
}

export function isTaggedSource(value: string) {
  return (
    value.startsWith(SHARE_TAG_PREFIX) &&
    TAG_RE.test(value.slice(SHARE_TAG_PREFIX.length))
  );
}

export function taggedShareUrl(url: string, tag: string) {
  const clean = normalizeShareTag(tag);
  if (!clean) return url;
  const next = new URL(url);
  next.searchParams.set(SHARE_TAG_PARAM, clean);
  return next.toString();
}

/** Human label for a stored source: "LinkedIn (your link)" or the host. */
export function sourceLabel(value: string) {
  if (!isTaggedSource(value)) return value;
  const tag = value.slice(SHARE_TAG_PREFIX.length);
  const known = SHARE_SOURCES.find((source) => source.tag === tag);
  const name =
    known?.label ??
    tag
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  return `${name} (your link)`;
}
