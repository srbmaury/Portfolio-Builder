import { NextResponse } from "next/server";
import { normalizeAnalyticsEventInput } from "@/lib/analytics";
import { createPublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > 8192) {
    return NextResponse.json({ error: "Analytics event is too large." }, { status: 413 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
  }

  const normalized = normalizeAnalyticsEventInput(body);
  if (!normalized.ok) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const value = normalized.value;
  const supabase = createPublicClient();
  const { error } = await supabase.from("analytics_events").insert({
    portfolio_id: value.portfolioId,
    event_type: value.eventType,
    visitor_id: value.visitorId,
    session_id: value.sessionId,
    target: value.target,
    referrer_host: value.referrerHost,
    device_type: value.deviceType,
  });

  if (error) {
    if (error.code === "23505" && value.eventType === "portfolio_view") {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(
      { error: "Analytics event was not recorded." },
      { status: 400 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
