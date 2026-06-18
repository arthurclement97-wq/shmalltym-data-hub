import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { adminStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => adminStats() });
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Orders (24h)", data?.ordersToday ?? 0],
          ["Revenue (24h)", `GH₵${(data?.revenueToday ?? 0).toFixed(2)}`],
          ["Total orders", data?.ordersTotal ?? 0],
          ["Users", data?.users ?? 0],
        ].map(([l, v]) => (
          <Card key={l as string} className="p-5">
            <div className="text-xs uppercase text-muted-foreground">{l}</div>
            <div className="mt-1 font-display text-2xl font-bold">{v}</div>
          </Card>
        ))}
      </div>
    </section>
  );
}
