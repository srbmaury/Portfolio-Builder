import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Resolved through Node rather than the bundler. officeparser ships browser,
  // import and require builds, and bundling it left its class export undefined
  // at runtime, so every résumé import failed to read the file.
  serverExternalPackages: ["officeparser"],
  devIndicators: false,
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
