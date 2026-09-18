import { NextResponse } from "next/server";
import { loadResumePdf, resumeResponseHeaders } from "@/lib/resume-delivery";
import type { PortfolioResume } from "@/lib/portfolio";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ variantKey: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { variantKey } = await params;
  if (!variantKey || variantKey.length > 160) {
    return NextResponse.json({ error: "Invalid portfolio identifier." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("portfolios")
    .select("resume_config")
    .eq("user_id", user.id)
    .eq("variant_key", variantKey)
    .maybeSingle();

  if (error || !data?.resume_config) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const resume = data.resume_config as PortfolioResume;
  if (!resume.url || !resume.publicId) {
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
