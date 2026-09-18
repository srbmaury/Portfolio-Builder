import type { Metadata } from "next";
import Link from "next/link";
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import { decodeSnapshot, sampleSnapshot } from "@/lib/portfolio";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ data?: string | string[] }>;
};

function readSnapshot(raw?: string) {
  if (!raw) return null;

  try {
    return decodeSnapshot(raw);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const raw = Array.isArray(query.data) ? query.data[0] : query.data;
  const snapshot = readSnapshot(raw);

  if (!snapshot) {
    return {
      title: `${slug.replace(/-/g, " ")} — Portfolio`,
      description: "A portfolio built with FolioBlocks.",
    };
  }

  const { profile } = snapshot.data;
  const targetRole = snapshot.meta?.targetRole || profile.role;

  return {
    title: `${profile.name} — ${targetRole}`,
    description: profile.tagline,
  };
}

export default async function PublishedPortfolio({ searchParams }: PageProps) {
  const query = await searchParams;
  const raw = Array.isArray(query.data) ? query.data[0] : query.data;
  const decoded = readSnapshot(raw);
  const invalid = Boolean(raw && !decoded);
  const snapshot = decoded || sampleSnapshot;

  return (
    <div className="published-shell">
      <div className="published-bar">
        <Link href="/">
          folio<span>blocks</span>
        </Link>
        <p>
          {invalid
            ? "This share link was invalid, so a demo portfolio is shown."
            : snapshot.meta
              ? `${snapshot.meta.name} · ${snapshot.meta.targetRole}`
              : "Shared portfolio"}
        </p>
        <Link href="/builder">Build yours →</Link>
      </div>
      <PortfolioRenderer snapshot={snapshot} />
    </div>
  );
}
