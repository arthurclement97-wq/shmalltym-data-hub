import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock, X, CircleCheck, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOrderTracking } from "@/lib/orders.functions";

export const Route = createFileRoute("/track/$orderId")({
  component: TrackOrder,
  head: () => ({ meta: [{ title: "Order status — Shmalltym Data Plug" }] }),
});

const STATUS_META: Record<string, { label: string; tone: string; icon: any }> = {
  pending: { label: "Pending", tone: "bg-warning/20 text-warning-foreground", icon: Clock },
  paid: { label: "Paid", tone: "bg-success/20 text-success-foreground", icon: Check },
  completed: { label: "Delivered", tone: "bg-secondary/20 text-secondary-foreground", icon: CircleCheck },
  cancelled: { label: "Cancelled", tone: "bg-destructive/20 text-destructive", icon: X },
  failed: { label: "Failed", tone: "bg-destructive/20 text-destructive", icon: X },
};

function TrackOrder() {
  const { orderId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["track", orderId],
    queryFn: () => getOrderTracking({ data: { orderId } }),
    refetchInterval: (q) => {
      const s = q.state.data?.order.status;
      return s === "paid" || s === "completed" || s === "cancelled" || s === "failed" ? false : 10000;
    },
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto flex max-w-xl items-center justify-center px-4 py-32 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading order…
        </div>
      </SiteLayout>
    );
  }

  if (!data) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-xl px-4 py-32 text-center">
          <h1 className="font-display text-2xl font-bold">Order not found</h1>
          <p className="mt-2 text-muted-foreground">Check the order ID and try again.</p>
          <Button asChild className="mt-6"><Link to="/track">Try another</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  const { order, events } = data;
  const meta = STATUS_META[order.status] ?? STATUS_META.pending;
  const StatusIcon = meta.icon;

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Order</div>
            <h1 className="font-display text-2xl font-bold">#{order.id.slice(0, 8)}</h1>
          </div>
          <Badge className={meta.tone}><StatusIcon className="mr-1 h-3 w-3" /> {meta.label}</Badge>
        </div>

        <Card className="mt-6 p-6">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div><div className="text-muted-foreground">Bundle</div><div className="font-semibold">{order.bundle_label} ({order.network_code.toUpperCase()})</div></div>
            <div><div className="text-muted-foreground">Recipient</div><div className="font-semibold">{order.recipient_phone}</div></div>
            <div><div className="text-muted-foreground">Amount</div><div className="font-semibold">GH₵{Number(order.amount).toFixed(2)}</div></div>
            <div><div className="text-muted-foreground">Placed</div><div className="font-semibold">{new Date(order.created_at).toLocaleString()}</div></div>
          </div>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="font-display text-lg font-semibold">Timeline</h2>
          <ol className="mt-4 space-y-4">
            {events.length === 0 && <li className="text-sm text-muted-foreground">No events yet.</li>}
            {events.map((e, i) => {
              const m = STATUS_META[e.status] ?? STATUS_META.pending;
              const Icon = m.icon;
              return (
                <li key={i} className="flex gap-3">
                  <span className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full ${m.tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{m.label}</div>
                    {e.note && <div className="text-sm text-muted-foreground">{e.note}</div>}
                    <div className="mt-0.5 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
                  </div>
                </li>
              );
            })}
          </ol>
          {(order.status === "pending" || order.status === "paid") && (
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Auto-refreshing every 10s…
            </div>
          )}
        </Card>
      </section>
    </SiteLayout>
  );
}
