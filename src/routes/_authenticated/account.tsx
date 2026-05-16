import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listMyOrders } from "@/lib/orders.functions";
import { getMyProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/account")({
  component: Account,
  head: () => ({ meta: [{ title: "My account — Shmalltym Data Plug" }] }),
});

function Account() {
  const { data: profile } = useQuery({ queryKey: ["me"], queryFn: () => getMyProfile() });
  const { data: orders } = useQuery({ queryKey: ["my-orders"], queryFn: () => listMyOrders() });
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold">My account</h1>
        <Card className="mt-6 p-6">
          <div className="text-sm text-muted-foreground">Signed in as</div>
          <div className="font-semibold">{profile?.profile?.full_name || profile?.profile?.email}</div>
          <div className="text-sm text-muted-foreground">{profile?.profile?.phone}</div>
        </Card>
        <h2 className="mt-10 font-display text-xl font-semibold">Recent orders</h2>
        <div className="mt-3 space-y-2">
          {(orders ?? []).map((o) => (
            <Link key={o.id} to="/track/$orderId" params={{ orderId: o.id }} className="block">
              <Card className="flex items-center justify-between p-4 hover:border-secondary">
                <div>
                  <div className="font-semibold">{o.bundle_label} — {o.network_code.toUpperCase()}</div>
                  <div className="text-xs text-muted-foreground">{o.recipient_phone} · {new Date(o.created_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold">GH₵{Number(o.amount).toFixed(2)}</div>
                  <div className="text-xs uppercase text-muted-foreground">{o.status}</div>
                </div>
              </Card>
            </Link>
          ))}
          {(!orders || orders.length === 0) && (
            <Card className="p-8 text-center text-muted-foreground">No orders yet. <Link to="/bundles" className="text-foreground underline">Buy a bundle</Link></Card>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
