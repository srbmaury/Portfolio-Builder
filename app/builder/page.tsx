import { PortfolioBuilder } from "@/components/PortfolioBuilder";

type Props = {
  searchParams: Promise<{ fresh?: string; portfolio?: string }>;
};

export default async function BuilderPage({ searchParams }: Props) {
  const { fresh, portfolio } = await searchParams;
  return (
    <PortfolioBuilder
      startFresh={fresh === "1"}
      initialVariantId={portfolio}
    />
  );
}
