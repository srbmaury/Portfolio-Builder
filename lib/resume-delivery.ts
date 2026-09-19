import { parseCloudinaryAssetUrl } from "@/lib/cloudinary-assets";
import {
  cloudinaryCloudName,
  cloudinarySignedPdfUrl,
} from "@/lib/cloudinary-server";
import type { PortfolioResume } from "@/lib/portfolio";

/**
 * Distinguishes a résumé whose file no longer exists from one that could not
 * be fetched right now. Calling it "temporarily unavailable" either way told
 * visitors to come back for a file that is never coming back.
 */
export class ResumeUnavailableError extends Error {
  readonly missing: boolean;

  constructor(message: string, missing: boolean) {
    super(message);
    this.name = "ResumeUnavailableError";
    this.missing = missing;
  }
}

export async function loadResumePdf(resume: PortfolioResume) {
  if (!resume.url || !resume.publicId) return null;

  const cloudName = cloudinaryCloudName();
  const asset = cloudName
    ? parseCloudinaryAssetUrl(resume.url, cloudName)
    : null;

  if (!asset || asset.publicId !== resume.publicId) return null;

  // A résumé is only ever uploaded as an image or raw asset.
  if (asset.resourceType !== "image" && asset.resourceType !== "raw") {
    return null;
  }

  // Both resource types need signing: a plain URL is refused while the
  // account has PDF delivery turned off, which is the default.
  const sourceUrl = cloudinarySignedPdfUrl(asset.publicId, asset.resourceType);

  const upstream = await fetch(sourceUrl, {
    cache: "no-store",
    headers: { Accept: "application/pdf" },
  });

  if (!upstream.ok) {
    const missing = upstream.status === 404 || upstream.status === 410;
    throw new ResumeUnavailableError(
      missing
        ? "This résumé file is no longer available."
        : "The résumé could not be loaded right now.",
      missing
    );
  }

  const body = await upstream.arrayBuffer();
  if (!isPdf(body)) {
    throw new ResumeUnavailableError("Resume source did not return a PDF.", true);
  }

  return {
    body,
    fileName: sanitizeResumeFileName(resume.fileName || "Resume.pdf"),
  };
}

export function resumeResponseHeaders(fileName: string) {
  return {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

function isPdf(body: ArrayBuffer) {
  if (body.byteLength < 5) return false;
  const bytes = new Uint8Array(body, 0, 5);
  return String.fromCharCode(...bytes) === "%PDF-";
}

function sanitizeResumeFileName(value: string) {
  const clean = value.replace(/[\r\n"\\/]/g, "_").trim();
  return clean.toLowerCase().endsWith(".pdf")
    ? clean
    : `${clean || "Resume"}.pdf`;
}

/**
 * Résumés are opened in a new tab and embedded in an iframe, so a failure is
 * read by a person, not by code. Answer with a short HTML page rather than a
 * JSON body the browser renders as raw text.
 */
export function resumeErrorResponse(error: unknown) {
  const unavailable =
    error instanceof ResumeUnavailableError
      ? error
      : new ResumeUnavailableError("The résumé could not be loaded right now.", false);

  const body = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Résumé unavailable</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         font-family: system-ui, sans-serif; background:#f5f6f8; color:#3a4150; }
  div { max-width: 28rem; padding: 24px; text-align: center; line-height: 1.6; }
  strong { display:block; margin-bottom:6px; color:#11151c; font-size:15px; }
  p { margin:0; font-size:13px; }
</style></head>
<body><div>
  <strong>${unavailable.missing ? "This résumé is no longer available." : "The résumé could not be loaded."}</strong>
  <p>${unavailable.missing
    ? "The file behind this link has been removed."
    : "Please try again in a moment."}</p>
</div></body></html>`;

  return new Response(body, {
    status: unavailable.missing ? 404 : 502,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
