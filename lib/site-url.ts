export function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://devfoliox.srbmaury.com"
  );
}
