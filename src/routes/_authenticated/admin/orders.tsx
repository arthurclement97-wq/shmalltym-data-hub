import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { adminListOrders, adminUpdateOrderStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const { data } = useQuery({ queryKey: ["admin-orders", status], queryFn: () => adminListOrders({ data: { status } }) });
  const update = useServerFn(adminUpdateOrderStatus);
  const set = async (id: string, s: any) => {
    try { await update({ data: { orderId: id, status: s } }); qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success(`Marked ${s}`); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Orders</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["all", "pending", "paid", "completed", "cancelled", "failed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="mt-6 space-y-2">
        {(data ?? []).map((o) => (
          <Card key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <Link to="/track/$orderId" params={{ orderId: o.id }} className="font-semibold hover:underline">#{o.id.slice(0,8)}</Link>
              <div className="text-xs text-muted-foreground">{o.bundle_label} ({o.network_code}) · {o.recipient_phone} · {new Date(o.created_at).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="font-display font-bold">GH₵{Number(o.amount).toFixed(2)}</div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase">{o.status}</span>
              {o.status !== "completed" && <Button size="sm" onClick={() => set(o.id, "completed")}>Mark delivered</Button>}
              {o.status === "pending" && <Button size="sm" variant="outline" onClick={() => set(o.id, "paid")}>Mark paid</Button>}
              {(o.status === "pending" || o.status === "paid") && <Button size="sm" variant="destructive" onClick={() => set(o.id, "cancelled")}>Cancel</Button>}
            </div>
          </Card>
        ))}
        {(!data || data.length === 0) && <Card className="p-8 text-center text-muted-foreground">No orders.</Card>}
      </div>
    </section>
  );
}
