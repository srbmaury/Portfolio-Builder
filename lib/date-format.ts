const portfolioDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatPortfolioDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return portfolioDateFormatter.format(date);
}
