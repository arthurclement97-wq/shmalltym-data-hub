import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { adminListPayments } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPayments,
});

function AdminPayments() {
  const { data } = useQuery({ queryKey: ["admin-payments"], queryFn: () => adminListPayments() });
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Payments & wallet</h1>
      <div className="mt-6 space-y-2">
        {(data ?? []).map((t) => (
          <Card key={t.id} className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-semibold">{t.type.toUpperCase()} · {t.user_id.slice(0,8)}</div>
              <div className="text-xs text-muted-foreground">{t.note} · {t.paystack_reference || "—"} · {new Date(t.created_at).toLocaleString()}</div>
            </div>
            <div className={`font-display font-bold ${Number(t.amount) >= 0 ? "text-secondary" : "text-destructive"}`}>
              {Number(t.amount) >= 0 ? "+" : ""}GH₵{Number(t.amount).toFixed(2)}
            </div>
          </Card>
        ))}
        {(!data || data.length === 0) && <Card className="p-8 text-center text-muted-foreground">No transactions.</Card>}
      </div>
    </section>
  );
}
