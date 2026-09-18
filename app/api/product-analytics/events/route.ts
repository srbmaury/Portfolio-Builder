import { NextResponse } from "next/server";
import { PRODUCT_EVENT_TYPES, type ProductEventType } from "@/lib/product-analytics";
import { createClient } from "@/lib/supabase/server";

const VARIANT_RE = /^[A-Za-z0-9._:-]{1,120}$/;

export async function POST(request: Request) {
  const raw = await request.text();

  if (raw.length > 2048) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw || "{}");
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid product event." }, { status: 400 });
  }

  const value = payload as Record<string, unknown>;
  const eventType =
    typeof value.eventType === "string"
      ? (value.eventType as ProductEventType)
      : null;
  const variantKey =
    typeof value.variantKey === "string" && value.variantKey.trim()
      ? value.variantKey.trim()
      : null;

  if (!eventType || !PRODUCT_EVENT_TYPES.includes(eventType)) {
    return NextResponse.json({ error: "Unsupported product event." }, { status: 400 });
  }

  if (variantKey && !VARIANT_RE.test(variantKey)) {
    return NextResponse.json({ error: "Invalid portfolio key." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { error } = await supabase.from("product_events").insert({
    user_id: data.user.id,
    event_type: eventType,
    variant_key: variantKey,
  });

  if (error) {
    return NextResponse.json({ error: "Could not record product event." }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
