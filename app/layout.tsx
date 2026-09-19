import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteOrigin } from "@/lib/site-url";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: "FolioBlocks — Build a portfolio from pieces you love",
  description:
    "Mix and match portfolio sections, keep your content structured, and publish a professional site in minutes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
