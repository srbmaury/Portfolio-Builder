import type { Metadata } from "next";
import Link from "next/link";
import { PortfolioRenderer } from "@/components/PortfolioRenderer";
import { decodeSnapshot, sampleSnapshot } from "@/lib/portfolio";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ data?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/g, " ")} — Portfolio`,
    description: "A portfolio built with FolioBlocks.",
  };
}

export default async function PublishedPortfolio({ searchParams }: PageProps) {
  const query = await searchParams;
  const raw = Array.isArray(query.data) ? query.data[0] : query.data;

  let snapshot = sampleSnapshot;
  let invalid = false;

  if (raw) {
    try {
      snapshot = decodeSnapshot(raw);
    } catch {
      invalid = true;
    }
  }

  return (
    <div className="published-shell">
      <div className="published-bar">
        <Link href="/">folio<span>blocks</span></Link>
        <p>{invalid ? "This share link was invalid, so a demo portfolio is shown." : "Shared portfolio"}</p>
        <Link href="/builder">Build yours →</Link>
      </div>
      <PortfolioRenderer snapshot={snapshot} />
    </div>
  );
}
