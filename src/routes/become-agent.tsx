import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Check, Store, Wallet, Zap } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { initAgentSignup } from "@/lib/orders.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/become-agent")({
  component: BecomeAgent,
  head: () => ({
    meta: [
      { title: "Become an Agent — Shmalltym Data Plug" },
      { name: "description", content: "Pay GH₵30 once. Get reduced data prices. Agents get their own storefront with custom pricing." },
    ],
  }),
});

function BecomeAgent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const init = useServerFn(initAgentSignup);
  const [tab, setTab] = useState<"reseller" | "agent">("agent");
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (!user) { navigate({ to: "/signup", search: { redirect: "/become-agent" } }); return; }
    if (tab === "agent" && (!storeName || !slug)) { toast.error("Store name and link required"); return; }
    setBusy(true);
    try {
      const res = await init({ data: { tier: tab, storeName: tab === "agent" ? storeName : undefined, slug: tab === "agent" ? slug : undefined, tagline: tagline || undefined } });
      if ((res as any).alreadyPaid) {
        toast.success(`You are now a ${tab}.`);
        navigate({ to: "/dashboard" });
      } else {
        window.location.href = (res as any).authorization_url;
      }
    } catch (e: any) {
      toast.error(e.message || "Could not start signup");
    } finally { setBusy(false); }
  };

  return (
    <SiteLayout>
      <section className="bg-grad-hero text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Run your own data store.</h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/80">
            One‑time GH₵30 unlocks reduced prices forever. Agents also get a personal store link, set their own retail prices, and keep the margin.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Wallet, t: "Reduced prices", d: "Lower wholesale rates on every bundle." },
            { icon: Store, t: "Your own store", d: "Agents get a /store/your-name link." },
            { icon: Zap, t: "Wallet & MoMo", d: "Top up once, pay orders instantly." },
          ].map((b) => (
            <Card key={b.t} className="p-6">
              <b.icon className="h-6 w-6 text-secondary" />
              <div className="mt-3 font-display text-lg font-semibold">{b.t}</div>
              <p className="text-sm text-muted-foreground">{b.d}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-10 p-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="agent">Agent — GH₵30</TabsTrigger>
              <TabsTrigger value="reseller">Reseller — GH₵30</TabsTrigger>
            </TabsList>
            <TabsContent value="agent" className="mt-4 space-y-4">
              <div>
                <Label htmlFor="sn">Store name *</Label>
                <Input id="sn" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Kofi Data Hub" />
              </div>
              <div>
                <Label htmlFor="slug">Store link *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">shmalltym.com/store/</span>
                  <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="kofi-data" />
                </div>
              </div>
              <div>
                <Label htmlFor="tg">Tagline (optional)</Label>
                <Input id="tg" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Cheapest data in Kumasi" />
              </div>
            </TabsContent>
            <TabsContent value="reseller" className="mt-4">
              <p className="text-sm text-muted-foreground">Resellers get reduced prices on all bundles and a wallet to place bulk orders quickly. No public storefront.</p>
            </TabsContent>
          </Tabs>

          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> One‑time GH₵30 signup fee</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> Pay via MoMo or card (Paystack)</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> Reduced wholesale data prices</li>
          </ul>

          <Button size="lg" className="mt-6 w-full" disabled={busy} onClick={go}>
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…</> : `Pay GH₵30 & become a ${tab}`}
          </Button>
          {!user && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              You'll be asked to <Link to="/signup" className="underline">create an account</Link> first.
            </p>
          )}
        </Card>
      </section>
    </SiteLayout>
  );
}
