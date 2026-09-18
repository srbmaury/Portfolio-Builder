import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import {
  loadPublishedSnapshot,
  safePublishedImageUrl,
} from "@/lib/supabase/public-portfolio";

type Props = {
  params: Promise<{ username: string; portfolio: string }>;
};

async function publicOrigin() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "portfolio-builder-miia.onrender.com";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, portfolio } = await params;
  const snapshot = await loadPublishedSnapshot(username, portfolio);

  if (!snapshot) {
    return {
      title: "Portfolio not found — FolioBlocks",
    };
  }

  const branding = snapshot.meta?.branding;
  const title =
    branding?.shareTitle?.trim() ||
    `${snapshot.data.profile.name} — ${snapshot.meta?.targetRole || snapshot.data.profile.role}`;
  const description =
    branding?.shareDescription?.trim() ||
    snapshot.data.profile.tagline;
  const favicon = safePublishedImageUrl(branding?.faviconUrl);
  const customShareImage = safePublishedImageUrl(branding?.shareImageUrl);
  const origin = await publicOrigin();
  const canonicalUrl = `${origin}/${username}/${portfolio}`;
  const shareImage =
    customShareImage ||
    `${canonicalUrl}/share-image`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    icons: favicon
      ? {
          icon: [{ url: favicon }],
          shortcut: [{ url: favicon }],
          apple: [{ url: favicon }],
        }
      : undefined,
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title,
      description,
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
  };
}

export default async function PublicPortfolioPage({ params }: Props) {
  const { username, portfolio } = await params;
  const snapshot = await loadPublishedSnapshot(username, portfolio);

  if (!snapshot) notFound();

  return <PortfolioRenderer snapshot={snapshot} />;
}
