import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // officeparser resolves pdf.js workers and format parsers dynamically at
  // runtime. Bundling it into a Next.js route can break those Node-only
  // lookups, so let Node load the package directly from node_modules.
  serverExternalPackages: ["officeparser"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
