import { PortfolioBuilder } from "@/components/PortfolioBuilder";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

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
  // The builder works signed out too; this only tells the navbar who is
  // signed in so it can show the account and sign-out controls.
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;

  return (
    <PortfolioBuilder
      startFresh={fresh === "1"}
      initialVariantId={portfolio}
      openCreateVariant={create === "1"}
      startWithDemo={demo === "1"}
      accountEmail={email}
      isAdmin={isAdminEmail(email)}
    />
  );
}
