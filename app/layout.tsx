import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteOrigin } from "@/lib/site-url";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

const TITLE = "DevFolioX — Build a portfolio from pieces you love";
const DESCRIPTION =
  "Mix and match portfolio sections, keep your content structured, and publish a professional site in minutes.";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "DevFolioX",
  // The card image itself comes from app/opengraph-image.tsx and
  // app/twitter-image.tsx, which Next resolves against metadataBase.
  openGraph: {
    type: "website",
    siteName: "DevFolioX",
    url: siteOrigin(),
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DevFolioX — build a portfolio from pieces you love",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/twitter-image"],
  },
  other: {
    "ory-verify": "orynth-53d2c4c72e0141eaa85c34a83e54b1c2",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
