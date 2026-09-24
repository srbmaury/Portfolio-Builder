import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Uptime / keep-alive endpoint for cron jobs.
 *
 *   GET /api/health        -> 200 {"status":"ok"} without touching anything
 *   GET /api/health?db=1   -> also runs one tiny public Supabase read, which
 *                             keeps a free Supabase project from pausing;
 *                             503 if the database cannot be reached
 */
export async function GET(request: Request) {
  const checkDb = new URL(request.url).searchParams.get("db") === "1";
  const time = new Date().toISOString();

  if (!checkDb) {
    return NextResponse.json({ status: "ok", time }, { headers: NO_STORE });
  }

  const started = Date.now();
  try {
    const { error } = await createPublicClient()
      .from("portfolios")
      .select("id")
      .limit(1);
    if (error) throw error;

    return NextResponse.json(
      { status: "ok", db: "ok", dbLatencyMs: Date.now() - started, time },
      { headers: NO_STORE }
    );
  } catch {
    // No error details: this endpoint is public.
    return NextResponse.json(
      { status: "degraded", db: "unreachable", time },
      { status: 503, headers: NO_STORE }
    );
  }
}
