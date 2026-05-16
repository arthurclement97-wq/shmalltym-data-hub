import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/profile.functions";
import { listMyBundles } from "@/lib/bundles.functions";
import { listAgentPrices, updateAgentStorefront, upsertAgentPrice } from "@/lib/agent.functions";

export const Route = createFileRoute("/_authenticated/dashboard_/store")({
  component: Store,
  head: () => ({ meta: [{ title: "My storefront — Shmalltym Data Plug" }] }),
});

function Store() {
  const qc = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["me"], queryFn: () => getMyProfile() });
  const { data: bundles } = useQuery({ queryKey: ["my-bundles"], queryFn: () => listMyBundles() });
  const { data: prices } = useQuery({ queryKey: ["agent-prices"], queryFn: () => listAgentPrices() });

  const updateStore = useServerFn(updateAgentStorefront);
  const upsertPrice = useServerFn(upsertAgentPrice);

  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile?.profile) {
      setStoreName(profile.profile.agent_store_name || "");
      setSlug(profile.profile.agent_slug || "");
      setTagline(profile.profile.agent_tagline || "");
    }
  }, [profile]);

  const priceMap = new Map((prices ?? []).map((p) => [p.bundle_id, Number(p.retail_price)]));

  const save = async () => {
    setBusy(true);
    try {
      await updateStore({ data: { storeName, slug, tagline: tagline || undefined } });
      toast.success("Storefront updated");
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const setPrice = async (bundleId: string, price: number) => {
    try {
      await upsertPrice({ data: { bundleId, retailPrice: price, active: true } });
      qc.invalidateQueries({ queryKey: ["agent-prices"] });
      toast.success("Price saved");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold">My storefront</h1>
        <Card className="mt-6 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Store name</Label><Input value={storeName} onChange={(e) => setStoreName(e.target.value)} /></div>
            <div><Label>Store link slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /></div>
            <div className="sm:col-span-2"><Label>Tagline</Label><Input value={tagline} onChange={(e) => setTagline(e.target.value)} /></div>
          </div>
          <Button className="mt-4" onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save storefront"}</Button>
          {slug && <p className="mt-2 text-sm text-muted-foreground">Public link: <code>/store/{slug}</code></p>}
        </Card>

        <h2 className="mt-10 font-display text-xl font-semibold">Set retail prices</h2>
        <p className="text-sm text-muted-foreground">Your wholesale cost is shown. Set the price you charge customers.</p>
        <div className="mt-4 space-y-2">
          {(bundles ?? []).map((b) => (
            <Card key={b.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <div className="font-semibold">{b.label} — {b.network_name}</div>
                <div className="text-xs text-muted-foreground">Your cost: GH₵{b.price.toFixed(2)}</div>
              </div>
              <PriceInput defaultValue={priceMap.get(b.id) ?? b.price} onSave={(v) => setPrice(b.id, v)} />
            </Card>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}

function PriceInput({ defaultValue, onSave }: { defaultValue: number; onSave: (n: number) => void }) {
  const [v, setV] = useState(defaultValue);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">GH₵</span>
      <Input type="number" step="0.5" value={v} onChange={(e) => setV(Number(e.target.value))} className="w-24" />
      <Button size="sm" onClick={() => onSave(v)}>Save</Button>
    </div>
  );
}
