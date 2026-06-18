import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { adminListBundles, adminSaveBundle, adminDeleteBundle } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/bundles")({
  component: AdminBundles,
});

function AdminBundles() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-bundles"], queryFn: () => adminListBundles() });
  const save = useServerFn(adminSaveBundle);
  const del = useServerFn(adminDeleteBundle);

  const update = async (b: any, patch: any) => {
    try {
      await save({ data: { ...b, ...patch, base_price: Number(patch.base_price ?? b.base_price),
        reseller_price: patch.reseller_price != null ? Number(patch.reseller_price) : b.reseller_price,
        agent_price: patch.agent_price != null ? Number(patch.agent_price) : b.agent_price,
        size_mb: Number(b.size_mb), sort_order: Number(b.sort_order ?? 0) } });
      qc.invalidateQueries({ queryKey: ["admin-bundles"] });
      toast.success("Saved");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Bundles</h1>
      <p className="mt-2 text-sm text-muted-foreground">Edit prices for base / reseller / agent tiers.</p>
      <div className="mt-6 space-y-6">
        {(data?.networks ?? []).map((n) => {
          const items = (data?.bundles ?? []).filter((b) => b.network_id === n.id);
          return (
            <div key={n.id}>
              <h2 className="font-display text-xl font-semibold">{n.name}</h2>
              <div className="mt-2 space-y-2">
                {items.map((b) => (
                  <BundleRow key={b.id} b={b} onSave={(patch) => update(b, patch)} onDelete={async () => { await del({ data: { id: b.id } }); qc.invalidateQueries({ queryKey: ["admin-bundles"] }); toast.success("Deleted"); }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BundleRow({ b, onSave, onDelete }: { b: any; onSave: (p: any) => void; onDelete: () => void }) {
  const [label, setLabel] = useState(b.label);
  const [base, setBase] = useState(b.base_price);
  const [res, setRes] = useState(b.reseller_price ?? "");
  const [ag, setAg] = useState(b.agent_price ?? "");
  return (
    <Card className="grid items-center gap-2 p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
      <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
      <Input type="number" value={base} onChange={(e) => setBase(Number(e.target.value))} placeholder="Base" />
      <Input type="number" value={res} onChange={(e) => setRes(e.target.value)} placeholder="Reseller" />
      <Input type="number" value={ag} onChange={(e) => setAg(e.target.value)} placeholder="Agent" />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ label, base_price: base, reseller_price: res === "" ? null : Number(res), agent_price: ag === "" ? null : Number(ag) })}>Save</Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>×</Button>
      </div>
    </Card>
  );
}
