import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioAnalyticsTracker } from "@/components/PortfolioAnalyticsTracker";
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import { siteOrigin } from "@/lib/site-url";
import {
  loadPublishedPortfolio,
  loadPublishedSnapshot,
  safePublishedImageUrl,
} from "@/lib/supabase/public-portfolio";

type Props = {
  params: Promise<{ username: string; portfolio: string }>;
};

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
  const origin = siteOrigin();
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
    robots: {
      index: true,
      follow: true,
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
  const published = await loadPublishedPortfolio(username, portfolio);

  if (!published) notFound();

  const publicUrl = `${siteOrigin()}/${username}/${portfolio}`;
  const profile = published.snapshot.data.profile;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: publicUrl,
    mainEntity: {
      "@type": "Person",
      name: profile.name,
      jobTitle: published.snapshot.meta?.targetRole || profile.role,
      description: profile.tagline || profile.about,
      url: publicUrl,
      sameAs: profile.socials.map((social) => social.url).filter(Boolean),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <PortfolioAnalyticsTracker portfolioId={published.id} />
      <PortfolioRenderer
        snapshot={published.snapshot}
        publicResumeUrl={`/api/public-resume/${published.id}`}
      />
    </>
  );
}
