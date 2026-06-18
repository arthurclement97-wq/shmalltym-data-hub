import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { listMyOrders } from "@/lib/orders.functions";

export const Route = createFileRoute("/_authenticated/dashboard_/orders")({
  component: Orders,
  head: () => ({ meta: [{ title: "My orders — Shmalltym Data Plug" }] }),
});

function Orders() {
  const { data } = useQuery({ queryKey: ["my-orders"], queryFn: () => listMyOrders() });
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold">My orders</h1>
        <div className="mt-6 space-y-2">
          {(data ?? []).map((o) => (
            <Link key={o.id} to="/track/$orderId" params={{ orderId: o.id }}>
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
          {(!data || data.length === 0) && <Card className="p-8 text-center text-muted-foreground">No orders yet.</Card>}
        </div>
      </section>
    </SiteLayout>
  );
}
