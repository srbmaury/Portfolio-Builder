export type AdminAnalyticsData = {
  days: 7 | 30 | 90;
  summary: {
    totalUsers: number;
    totalPortfolios: number;
    publishedPortfolios: number;
    activePortfolios: number;
    views: number;
    uniqueVisitors: number;
    engagedVisitors: number;
    engagementRate: number;
    resumeOpens: number;
    contactClicks: number;
    projectClicks: number;
    socialClicks: number;
  };
  daily: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
    signups: number;
  }>;
  referrers: Array<{ label: string; count: number }>;
  devices: Array<{ label: string; count: number }>;
  actions: Array<{ label: string; count: number }>;
  topPortfolios: Array<{
    id: string;
    name: string;
    publicPath: string | null;
    isPublished: boolean;
    views: number;
    uniqueVisitors: number;
    engagementRate: number;
  }>;
};

export function AdminAnalyticsDashboard({
  data,
}: {
  data: AdminAnalyticsData;
}) {
  const maxViews = Math.max(1, ...data.daily.map((row) => row.views));

  return (
    <main className="analytics-shell admin-analytics-shell">
      <header className="analytics-topbar">
        <a className="brand" href="/">
          folio<span>blocks</span>
        </a>
        <nav>
          <a className="ghost-button" href="/analytics">
            Creator analytics
          </a>
          <a className="ghost-button" href="/portfolios">
            My Portfolios
          </a>
          <a className="primary-button" href="/builder">
            Builder
          </a>
        </nav>
      </header>

      <section className="analytics-content">
        <div className="analytics-heading">
          <p className="panel-kicker">Admin</p>
          <h1>FolioBlocks analytics</h1>
          <p>
            Product-level acquisition, publishing, traffic, and portfolio
            engagement. Visitor analytics remain anonymous.
          </p>
        </div>

        <div className="analytics-controls admin-range-control">
          <div className="analytics-range">
            {[7, 30, 90].map((days) => (
              <a
                key={days}
                className={data.days === days ? "active" : ""}
                href={`/admin/analytics?days=${days}`}
              >
                {days}d
              </a>
            ))}
          </div>
        </div>

        <div className="analytics-metric-grid admin-metric-grid">
          <AdminMetric label="Accounts" value={data.summary.totalUsers} />
          <AdminMetric label="Portfolios" value={data.summary.totalPortfolios} />
          <AdminMetric
            label="Published"
            value={data.summary.publishedPortfolios}
          />
          <AdminMetric
            label={`Active · ${data.days}d`}
            value={data.summary.activePortfolios}
          />
          <AdminMetric label="Views" value={data.summary.views} />
          <AdminMetric
            label="Unique visitors"
            value={data.summary.uniqueVisitors}
          />
          <AdminMetric
            label="Engaged visitors"
            value={data.summary.engagedVisitors}
          />
          <AdminMetric
            label="Engagement rate"
            value={`${data.summary.engagementRate}%`}
          />
        </div>

        <div className="analytics-grid analytics-grid-wide">
          <section className="analytics-panel analytics-trend-panel">
            <div className="analytics-panel-heading">
              <h2>Traffic & signups</h2>
              <span>Last {data.days} days</span>
            </div>
            {data.daily.length ? (
              <div className="admin-trend-list">
                {data.daily.map((row) => (
                  <div className="admin-trend-row" key={row.date}>
                    <span>{shortDate(row.date)}</span>
                    <div className="admin-trend-track">
                      <span
                        style={{
                          width: `${Math.max(3, (row.views / maxViews) * 100)}%`,
                        }}
                      />
                    </div>
                    <strong>{row.views}</strong>
                    <small>{row.signups} signups</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="analytics-empty">No activity in this period yet.</p>
            )}
          </section>

          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <h2>Visitor actions</h2>
              <span>Intent signals</span>
            </div>
            <AdminBreakdown items={data.actions} />
          </section>
        </div>

        <div className="analytics-grid">
          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <h2>Traffic sources</h2>
              <span>Hostname only</span>
            </div>
            <AdminBreakdown items={data.referrers} />
          </section>

          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <h2>Devices</h2>
              <span>Coarse type</span>
            </div>
            <AdminBreakdown items={data.devices} />
          </section>
        </div>

        <section className="analytics-panel analytics-comparison">
          <div className="analytics-panel-heading">
            <h2>Top portfolios</h2>
            <span>By views · {data.days}d</span>
          </div>

          {data.topPortfolios.length ? (
            <div className="analytics-table-wrap">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Portfolio</th>
                    <th>Views</th>
                    <th>Unique</th>
                    <th>Engagement</th>
                    <th>Public page</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPortfolios.map((portfolio) => (
                    <tr key={portfolio.id}>
                      <td>{portfolio.name}</td>
                      <td>{portfolio.views}</td>
                      <td>{portfolio.uniqueVisitors}</td>
                      <td>{portfolio.engagementRate}%</td>
                      <td>
                        {portfolio.isPublished && portfolio.publicPath ? (
                          <a
                            href={`/${portfolio.publicPath}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open ↗
                          </a>
                        ) : (
                          "Draft"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="analytics-empty">No viewed portfolios yet.</p>
          )}
        </section>
      </section>
    </main>
  );
}

function AdminMetric({
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

function AdminBreakdown({
  items,
}: {
  items: Array<{ label: string; count: number }>;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  if (!items.length) {
    return <p className="analytics-empty">No data yet.</p>;
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

function shortDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
