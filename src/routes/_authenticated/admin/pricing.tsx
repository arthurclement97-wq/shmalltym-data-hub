import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { adminListOverrides, adminSetOverride, adminDeleteOverride, adminListUsers, adminListBundles } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/pricing")({
  component: AdminPricing,
});

function AdminPricing() {
  const qc = useQueryClient();
  const { data: overrides } = useQuery({ queryKey: ["overrides"], queryFn: () => adminListOverrides() });
  const { data: users } = useQuery({ queryKey: ["admin-users"], queryFn: () => adminListUsers() });
  const { data: bdata } = useQuery({ queryKey: ["admin-bundles"], queryFn: () => adminListBundles() });
  const setO = useServerFn(adminSetOverride);
  const delO = useServerFn(adminDeleteOverride);
  const [userId, setUserId] = useState("");
  const [bundleId, setBundleId] = useState("");
  const [price, setPrice] = useState(0);

  const userById = new Map((users ?? []).map((u) => [u.id, u]));
  const bundleById = new Map((bdata?.bundles ?? []).map((b) => [b.id, b]));

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Per-user pricing</h1>
      <Card className="mt-4 p-4">
        <div className="grid gap-2 sm:grid-cols-4">
          <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Pick user</option>
            {(users ?? []).map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
          </select>
          <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={bundleId} onChange={(e) => setBundleId(e.target.value)}>
            <option value="">Pick bundle</option>
            {(bdata?.bundles ?? []).map((b) => <option key={b.id} value={b.id}>{b.label} ({b.network_id.slice(0,4)})</option>)}
          </select>
          <Input type="number" placeholder="Price GH₵" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          <Button onClick={async () => {
            if (!userId || !bundleId || !price) return;
            await setO({ data: { userId, bundleId, price } });
            qc.invalidateQueries({ queryKey: ["overrides"] });
            toast.success("Saved");
          }}>Add override</Button>
        </div>
      </Card>

      <div className="mt-6 space-y-2">
        {(overrides ?? []).map((o) => {
          const u = userById.get(o.user_id);
          const b = bundleById.get(o.bundle_id);
          return (
            <Card key={o.id} className="flex items-center justify-between p-3">
              <div className="text-sm">
                <span className="font-semibold">{u?.full_name || u?.email || o.user_id.slice(0,8)}</span> → {b?.label || o.bundle_id.slice(0,8)} @ <span className="font-bold">GH₵{Number(o.price).toFixed(2)}</span>
              </div>
              <Button size="sm" variant="destructive" onClick={async () => { await delO({ data: { id: o.id } }); qc.invalidateQueries({ queryKey: ["overrides"] }); }}>×</Button>
            </Card>
          );
        })}
        {(!overrides || overrides.length === 0) && <Card className="p-8 text-center text-muted-foreground">No overrides yet.</Card>}
      </div>
    </section>
  );
}
