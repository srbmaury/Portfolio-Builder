import { PortfolioBuilder } from "@/components/PortfolioBuilder";

type Props = {
  searchParams: Promise<{ fresh?: string; portfolio?: string; create?: string }>;
};

export default async function BuilderPage({ searchParams }: Props) {
  const { fresh, portfolio, create } = await searchParams;
  return (
    <PortfolioBuilder
      startFresh={fresh === "1"}
      initialVariantId={portfolio}
      openCreateVariant={create === "1"}
    />
  );
}
