import { currentUser } from "@/lib/auth";
import { MarketplaceExplorer } from "@/components/marketplace/MarketplaceExplorer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await currentUser();
  return <MarketplaceExplorer authed={!!user} userName={user?.full_name ?? null} />;
}
