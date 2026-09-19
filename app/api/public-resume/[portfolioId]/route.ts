import { NextResponse } from "next/server";
import {
  ResumeUnavailableError,
  loadResumePdf,
  resumeErrorResponse,
  resumeResponseHeaders,
} from "@/lib/resume-delivery";
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
    return resumeErrorResponse(
        new ResumeUnavailableError("This résumé is no longer available.", true)
      );
  }

  const snapshot = data.published_snapshot as PortfolioSnapshot;
  const resume = snapshot.meta?.resume;

  if (!resume?.url || !resume.publicId) {
    return resumeErrorResponse(
        new ResumeUnavailableError("This résumé is no longer available.", true)
      );
  }

  try {
    const pdf = await loadResumePdf(resume);

    if (!pdf) {
      return resumeErrorResponse(
        new ResumeUnavailableError("This résumé is no longer available.", true)
      );
    }

    return new NextResponse(pdf.body, {
      status: 200,
      headers: resumeResponseHeaders(pdf.fileName),
    });
  } catch (error) {
    return resumeErrorResponse(error);
  }
}
