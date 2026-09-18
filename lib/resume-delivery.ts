import { parseCloudinaryAssetUrl } from "@/lib/cloudinary-assets";
import {
  cloudinaryCloudName,
  cloudinaryLegacyPdfDownloadUrl,
} from "@/lib/cloudinary-server";
import type { PortfolioResume } from "@/lib/portfolio";

export async function loadResumePdf(resume: PortfolioResume) {
  if (!resume.url || !resume.publicId) return null;

  const cloudName = cloudinaryCloudName();
  const asset = cloudName
    ? parseCloudinaryAssetUrl(resume.url, cloudName)
    : null;

  if (!asset || asset.publicId !== resume.publicId) return null;

  const sourceUrl =
    asset.resourceType === "image"
      ? cloudinaryLegacyPdfDownloadUrl(asset.publicId)
      : resume.url;

  const upstream = await fetch(sourceUrl, {
    cache: "no-store",
    headers: { Accept: "application/pdf" },
  });

  if (!upstream.ok) {
    throw new Error("Resume delivery is temporarily unavailable.");
  }

  const body = await upstream.arrayBuffer();
  if (!isPdf(body)) {
    throw new Error("Resume source did not return a PDF.");
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
