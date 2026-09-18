import { PortfolioBuilder } from "@/components/PortfolioBuilder";

type Props = {
  searchParams: Promise<{ fresh?: string }>;
};

export default async function BuilderPage({ searchParams }: Props) {
  const { fresh } = await searchParams;
  return <PortfolioBuilder startFresh={fresh === "1"} />;
}
