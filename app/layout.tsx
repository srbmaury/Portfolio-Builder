import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { siteOrigin } from "@/lib/site-url";
import "./globals.css";

// Inter is the app's UI font. Published portfolios keep Geist (their
// original font) through --font-portfolio so this change does not restyle them.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geist = Geist({ subsets: ["latin"], variable: "--font-portfolio" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

const TITLE = "DevFolioX — A live portfolio link, no code, with analytics";
const DESCRIPTION =
  "Fill in your details, publish, and share one URL. DevFolioX hosts your portfolio and counts how many people viewed it, which sites sent them, and how many opened your résumé.";

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
        alt: "DevFolioX — a live portfolio link, no code, with analytics",
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
      <body className={`${inter.variable} ${geist.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
