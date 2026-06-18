import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Store, ListOrdered, ShoppingBag, UserCog } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { getMyProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Shmalltym Data Plug" }] }),
});

function Dashboard() {
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => getMyProfile() });
  const roles: string[] = data?.roles ?? [];
  const isAgent = roles.includes("agent");
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <div className="mt-2 text-sm text-muted-foreground">{roles.join(", ").toUpperCase() || "CUSTOMER"}</div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <Wallet className="h-6 w-6 text-secondary" />
            <div className="mt-3 text-xs uppercase text-muted-foreground">Wallet</div>
            <div className="font-display text-3xl font-bold">GH₵{Number(data?.profile?.wallet_balance ?? 0).toFixed(2)}</div>
            <Link to="/dashboard/wallet" className="mt-3 inline-block text-sm font-semibold text-secondary hover:underline">Top up →</Link>
          </Card>
          <Card className="p-6">
            <ShoppingBag className="h-6 w-6 text-secondary" />
            <div className="mt-3 text-xs uppercase text-muted-foreground">Quick</div>
            <div className="font-display text-lg font-semibold">Place an order</div>
            <Link to="/bundles" className="mt-3 inline-block text-sm font-semibold text-secondary hover:underline">Browse bundles →</Link>
          </Card>
          <Card className="p-6">
            <ListOrdered className="h-6 w-6 text-secondary" />
            <div className="mt-3 text-xs uppercase text-muted-foreground">History</div>
            <div className="font-display text-lg font-semibold">My orders</div>
            <Link to="/dashboard/orders" className="mt-3 inline-block text-sm font-semibold text-secondary hover:underline">View all →</Link>
          </Card>
          <Card className="p-6">
            <UserCog className="h-6 w-6 text-secondary" />
            <div className="mt-3 text-xs uppercase text-muted-foreground">Account</div>
            <div className="font-display text-lg font-semibold">My profile</div>
            <Link to="/dashboard/profile" className="mt-3 inline-block text-sm font-semibold text-secondary hover:underline">Edit profile, email & password →</Link>
          </Card>
          {isAgent && (
            <Card className="p-6">
              <Store className="h-6 w-6 text-secondary" />
              <div className="mt-3 text-xs uppercase text-muted-foreground">Storefront</div>
              <div className="font-display text-lg font-semibold">/store/{data?.profile?.agent_slug || "—"}</div>
              <Link to="/dashboard/store" className="mt-3 inline-block text-sm font-semibold text-secondary hover:underline">Manage store →</Link>
            </Card>
          )}
        </div>
      </section>
      <Outlet />
    </SiteLayout>
  );
}
