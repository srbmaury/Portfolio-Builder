import { PortfolioBuilder } from "@/components/PortfolioBuilder";

type Props = {
  searchParams: Promise<{
    fresh?: string;
    portfolio?: string;
    create?: string;
    demo?: string;
  }>;
};

export default async function BuilderPage({ searchParams }: Props) {
  const { fresh, portfolio, create, demo } = await searchParams;
  return (
    <PortfolioBuilder
      startFresh={fresh === "1"}
      initialVariantId={portfolio}
      openCreateVariant={create === "1"}
      startWithDemo={demo === "1"}
    />
  );
}
