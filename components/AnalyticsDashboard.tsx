import type { OwnerAnalyticsData } from "@/lib/supabase/analytics-store";
import { AppNav } from "@/components/AppNav";
import { sourceLabel } from "@/lib/share-links";

export function AnalyticsDashboard({
  data,
  email,
  isAdmin = false,
}: {
  data: OwnerAnalyticsData;
  email: string | null;
  isAdmin?: boolean;
}) {
  const { analytics, comparison, portfolios, selectedVariantKey, days } = data;
  const metrics = analytics.summary;
  // Label roughly eight evenly spaced days so 90-day ranges stay readable.
  const labelStep = Math.max(1, Math.ceil(analytics.daily.length / 8));
  const maxDailyViews = Math.max(
    1,
    ...analytics.daily.map((item) => item.views)
  );

  return (
    <main className="analytics-shell">
      <AppNav current="analytics" email={email} isAdmin={isAdmin} />

      <section className="analytics-content">
        <div className="analytics-heading">
          <h1>Analytics</h1>
          <p>
            How many people opened your portfolios, which sites sent them, and what
            they clicked. Visitor IP addresses are never stored.
          </p>
        </div>

        <div className="analytics-controls">
          <div className="analytics-tabs">
            <AnalyticsLink
              href={rangeHref(days, null)}
              active={!selectedVariantKey}
            >
              All portfolios
            </AnalyticsLink>
            {portfolios.map((portfolio) => (
              <AnalyticsLink
                key={portfolio.id}
                href={rangeHref(days, portfolio.variantKey)}
                active={selectedVariantKey === portfolio.variantKey}
              >
                {portfolio.name}
              </AnalyticsLink>
            ))}
          </div>

          <div className="analytics-range">
            {[7, 30, 90].map((range) => (
              <AnalyticsLink
                key={range}
                href={rangeHref(range, selectedVariantKey)}
                active={days === range}
              >
                {range}d
              </AnalyticsLink>
            ))}
          </div>
        </div>

        <div className="analytics-metric-grid">
          <MetricCard label="Views" value={metrics.views} />
          <MetricCard label="Unique visitors" value={metrics.uniqueVisitors} />
          <MetricCard
            label="Engaged visitors"
            value={metrics.engagedVisitors}
          />
          <MetricCard
            label="Engagement rate"
            value={`${metrics.engagementRate}%`}
          />
          <MetricCard label="Resume opens" value={metrics.resumeOpens} />
          <MetricCard label="Contact clicks" value={metrics.contactClicks} />
          <MetricCard label="Project clicks" value={metrics.projectClicks} />
          <MetricCard label="Social clicks" value={metrics.socialClicks} />
        </div>

        <div className="analytics-grid analytics-grid-wide">
          <section className="analytics-panel analytics-trend-panel">
            <PanelHeading
              title="Views over time"
              note={`Last ${days} days`}
            />
            {analytics.daily.length ? (
              <div className="analytics-chart">
                {analytics.daily.map((item, index) => (
                  <div className="analytics-bar-column" key={item.date}>
                    <div
                      className="analytics-bar"
                      style={{
                        height: `${Math.max(
                          6,
                          (item.views / maxDailyViews) * 100
                        )}%`,
                      }}
                      title={`${item.views} views · ${item.uniqueVisitors} unique · ${item.engagements} engagements`}
                    />
                    <span>
                      {index % labelStep === 0 ||
                      index === analytics.daily.length - 1
                        ? shortDate(item.date)
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyAnalytics message="No portfolio views in this period yet." />
            )}
          </section>

          <section className="analytics-panel">
            <PanelHeading title="Top actions" note="Visitor intent" />
            <BreakdownList
              items={analytics.actions}
              empty="No tracked actions yet."
            />
          </section>
        </div>

        <div className="analytics-grid">
          <section className="analytics-panel">
            <PanelHeading title="Traffic sources" note="Untagged email, PDF, and app visits count as Direct" />
            <BreakdownList
              items={analytics.referrers.map((item) => ({
                ...item,
                label: sourceLabel(item.label),
              }))}
              empty="No referrer data yet."
            />
          </section>

          <section className="analytics-panel">
            <PanelHeading title="Devices" note="Coarse device type" />
            <BreakdownList
              items={analytics.devices}
              empty="No device data yet."
            />
          </section>
        </div>

        <section className="analytics-panel analytics-comparison">
          <PanelHeading
            title="Portfolio performance"
            note={`Compared over ${days} days`}
          />
          {comparison.length ? (
            <div className="analytics-table-wrap">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Portfolio</th>
                    <th>Views</th>
                    <th>Unique</th>
                    <th>Engaged</th>
                    <th>Engagement</th>
                    <th>Resume</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((portfolio) => (
                    <tr key={portfolio.id}>
                      <td>
                        <a
                          href={rangeHref(days, portfolio.variantKey)}
                        >
                          {portfolio.name}
                        </a>
                        <small>
                          {portfolio.isPublished ? "Published" : "Draft"}
                        </small>
                      </td>
                      <td>{portfolio.views}</td>
                      <td>{portfolio.uniqueVisitors}</td>
                      <td>{portfolio.engagedVisitors}</td>
                      <td>{portfolio.engagementRate}%</td>
                      <td>{portfolio.resumeOpens}</td>
                      <td>{portfolio.contactClicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyAnalytics message="Create and publish a portfolio to start collecting analytics." />
          )}
        </section>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="analytics-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PanelHeading({ title, note }: { title: string; note: string }) {
  return (
    <div className="analytics-panel-heading">
      <h2>{title}</h2>
      <span>{note}</span>
    </div>
  );
}

function BreakdownList({
  items,
  empty,
}: {
  items: Array<{ label: string; count: number }>;
  empty: string;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  if (!items.length) {
    return <EmptyAnalytics message={empty} />;
  }

  return (
    <div className="analytics-breakdown">
      {items.map((item) => (
        <div className="analytics-breakdown-row" key={item.label}>
          <div>
            <strong>{item.label}</strong>
            <span>{item.count}</span>
          </div>
          <div className="analytics-progress">
            <span
              style={{
                width: `${total ? Math.max(4, (item.count / total) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyAnalytics({ message }: { message: string }) {
  return <p className="analytics-empty">{message}</p>;
}

function AnalyticsLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a className={active ? "active" : ""} href={href}>
      {children}
    </a>
  );
}

function rangeHref(days: number, variantKey: string | null) {
  const params = new URLSearchParams({ days: String(days) });
  if (variantKey) params.set("portfolio", variantKey);
  return `/analytics?${params.toString()}`;
}

function shortDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
