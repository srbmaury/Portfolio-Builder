import { NextResponse } from "next/server";
import { loadResumePdf, resumeResponseHeaders } from "@/lib/resume-delivery";
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

  try {
    const pdf = await loadResumePdf(resume);

    if (!pdf) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    }

    return new NextResponse(pdf.body, {
      status: 200,
      headers: resumeResponseHeaders(pdf.fileName),
    });
  } catch {
    return NextResponse.json(
      { error: "Resume delivery is temporarily unavailable." },
      { status: 502 }
    );
  }
}
