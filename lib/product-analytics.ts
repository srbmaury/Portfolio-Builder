export const PRODUCT_EVENT_TYPES = [
  "builder_opened",
  "resume_import_started",
  "resume_import_succeeded",
  "resume_import_failed",
  "portfolio_created",
  "workspace_saved",
  "portfolio_published",
] as const;

export type ProductEventType = (typeof PRODUCT_EVENT_TYPES)[number];

export function trackProductEvent(
  eventType: ProductEventType,
  variantKey?: string | null
) {
  if (typeof window === "undefined") return;

  void fetch("/api/product-analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType,
      variantKey: variantKey || null,
    }),
    keepalive: true,
  }).catch(() => {
    // Product analytics must never interrupt the builder.
  });
}
