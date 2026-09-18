import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type EventRow = {
  portfolio_id: string;
  event_type: string;
  visitor_id: string;
  referrer_host: string;
  device_type: string;
  created_at: string;
};

type PortfolioRow = {
  id: string;
  name: string;
  variant_key: string;
  public_path: string | null;
  is_published: boolean;
  created_at: string;
};

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const token = authorization.slice("Bearer ".length);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return Response.json(
      { error: "Admin analytics is not configured." },
      { status: 503 }
    );
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: adminMembership, error: adminError } = await admin
    .from("analytics_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    return Response.json({ error: "Admin verification failed." }, { status: 500 });
  }

  if (!adminMembership) {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const days = normalizeDays(Number(payload?.days || 30));
  const start = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  start.setUTCHours(0, 0, 0, 0);

  const [usersResult, portfoliosResult, eventsResult] = await Promise.all([
    listAllUsers(admin),
    admin
      .from("portfolios")
      .select("id, name, variant_key, public_path, is_published, created_at"),
    admin
      .from("analytics_events")
      .select(
        "portfolio_id, event_type, visitor_id, referrer_host, device_type, created_at"
      )
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: true }),
  ]);

  if (portfoliosResult.error || eventsResult.error) {
    return Response.json(
      { error: "Admin analytics query failed." },
      { status: 500 }
    );
  }

  const users = usersResult;
  const portfolios = (portfoliosResult.data || []) as PortfolioRow[];
  const events = (eventsResult.data || []) as EventRow[];
  const viewEvents = events.filter((event) => event.event_type === "portfolio_view");
  const engagementEvents = events.filter(
    (event) => event.event_type !== "portfolio_view"
  );
  const uniqueVisitors = new Set(viewEvents.map((event) => event.visitor_id));
  const engagedVisitors = new Set(
    engagementEvents
      .map((event) => event.visitor_id)
      .filter((visitorId) => uniqueVisitors.has(visitorId))
  );
  const activePortfolios = new Set(viewEvents.map((event) => event.portfolio_id));

  const dailyMap = new Map<
    string,
    { views: number; visitors: Set<string>; signups: number }
  >();

  for (const event of viewEvents) {
    const date = event.created_at.slice(0, 10);
    const row = dailyMap.get(date) || {
      views: 0,
      visitors: new Set<string>(),
      signups: 0,
    };
    row.views += 1;
    row.visitors.add(event.visitor_id);
    dailyMap.set(date, row);
  }

  for (const account of users) {
    if (!account.created_at || account.created_at < start.toISOString()) continue;
    const date = account.created_at.slice(0, 10);
    const row = dailyMap.get(date) || {
      views: 0,
      visitors: new Set<string>(),
      signups: 0,
    };
    row.signups += 1;
    dailyMap.set(date, row);
  }

  const portfolioById = new Map(portfolios.map((portfolio) => [portfolio.id, portfolio]));
  const portfolioStats = new Map<
    string,
    { views: number; visitors: Set<string>; engaged: Set<string> }
  >();

  for (const event of events) {
    const row = portfolioStats.get(event.portfolio_id) || {
      views: 0,
      visitors: new Set<string>(),
      engaged: new Set<string>(),
    };

    if (event.event_type === "portfolio_view") {
      row.views += 1;
      row.visitors.add(event.visitor_id);
    } else {
      row.engaged.add(event.visitor_id);
    }

    portfolioStats.set(event.portfolio_id, row);
  }

  const topPortfolios = [...portfolioStats.entries()]
    .map(([portfolioId, stats]) => {
      const portfolio = portfolioById.get(portfolioId);
      const engaged = [...stats.engaged].filter((id) => stats.visitors.has(id)).length;
      return {
        id: portfolioId,
        name: portfolio?.name || "Untitled portfolio",
        publicPath: portfolio?.public_path || null,
        isPublished: Boolean(portfolio?.is_published),
        views: stats.views,
        uniqueVisitors: stats.visitors.size,
        engagementRate:
          stats.visitors.size === 0
            ? 0
            : Math.round((engaged / stats.visitors.size) * 1000) / 10,
      };
    })
    .sort((left, right) => right.views - left.views)
    .slice(0, 10);

  const response = {
    days,
    summary: {
      totalUsers: users.length,
      totalPortfolios: portfolios.length,
      publishedPortfolios: portfolios.filter((portfolio) => portfolio.is_published).length,
      activePortfolios: activePortfolios.size,
      views: viewEvents.length,
      uniqueVisitors: uniqueVisitors.size,
      engagedVisitors: engagedVisitors.size,
      engagementRate:
        uniqueVisitors.size === 0
          ? 0
          : Math.round((engagedVisitors.size / uniqueVisitors.size) * 1000) / 10,
      resumeOpens: countEvent(events, "resume_opened"),
      contactClicks: countEvent(events, "contact_clicked"),
      projectClicks: countEvent(events, "project_clicked"),
      socialClicks: countEvent(events, "social_clicked"),
    },
    daily: [...dailyMap.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, row]) => ({
        date,
        views: row.views,
        uniqueVisitors: row.visitors.size,
        signups: row.signups,
      })),
    referrers: breakdown(
      viewEvents.map((event) => event.referrer_host || "Direct")
    ),
    devices: breakdown(
      viewEvents.map((event) => event.device_type || "unknown")
    ),
    actions: [
      { label: "Project clicks", count: countEvent(events, "project_clicked") },
      { label: "Resume opens", count: countEvent(events, "resume_opened") },
      { label: "Contact clicks", count: countEvent(events, "contact_clicked") },
      { label: "Social clicks", count: countEvent(events, "social_clicked") },
      { label: "Custom link clicks", count: countEvent(events, "custom_link_clicked") },
    ].filter((item) => item.count > 0),
    topPortfolios,
  };

  return Response.json(response);
});

async function listAllUsers(admin: ReturnType<typeof createClient>) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) throw error;
    users.push(...data.users);

    if (data.users.length < 1000) break;
    page += 1;
  }

  return users;
}

function normalizeDays(value: number): 7 | 30 | 90 {
  if (value === 7 || value === 90) return value;
  return 30;
}

function countEvent(events: EventRow[], eventType: string) {
  return events.filter((event) => event.event_type === eventType).length;
}

function breakdown(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = value || "Direct";
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 10);
}
