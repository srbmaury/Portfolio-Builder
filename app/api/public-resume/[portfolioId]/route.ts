import { NextResponse } from "next/server";
import { parseCloudinaryAssetUrl } from "@/lib/cloudinary-assets";
import {
  cloudinaryCloudName,
  cloudinaryLegacyPdfDownloadUrl,
} from "@/lib/cloudinary-server";
import type { PortfolioSnapshot } from "@/lib/portfolio";
import { createPublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ portfolioId: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { portfolioId } = await params;
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("portfolios")
    .select("is_published, published_snapshot")
    .eq("id", portfolioId)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data?.is_published || !data.published_snapshot) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const snapshot = data.published_snapshot as PortfolioSnapshot;
  const resume = snapshot.meta?.resume;

  if (!resume?.url || !resume.publicId) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const cloudName = cloudinaryCloudName();
  const asset = cloudName
    ? parseCloudinaryAssetUrl(resume.url, cloudName)
    : null;

  if (!asset || asset.publicId !== resume.publicId) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  try {
    const sourceUrl =
      asset.resourceType === "image"
        ? cloudinaryLegacyPdfDownloadUrl(asset.publicId)
        : resume.url;

    const upstream = await fetch(sourceUrl, {
      cache: "no-store",
      headers: { Accept: "application/pdf" },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Resume delivery is temporarily unavailable." },
        { status: 502 }
      );
    }

    const body = await upstream.arrayBuffer();
    const fileName = sanitizeFileName(resume.fileName || "Resume.pdf");

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Resume delivery is temporarily unavailable." },
      { status: 502 }
    );
  }
}

function sanitizeFileName(value: string) {
  const clean = value.replace(/[\r\n"\\/]/g, "_").trim();
  return clean.toLowerCase().endsWith(".pdf")
    ? clean
    : `${clean || "Resume"}.pdf`;
}
