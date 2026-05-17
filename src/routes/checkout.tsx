import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { listPublicBundles, listMyBundles } from "@/lib/bundles.functions";
import { initOrderPayment, initOrderPaymentAuth } from "@/lib/orders.functions";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";

const searchSchema = z.object({
  bundle: z.string().uuid().optional(),
  agent: z.string().min(1).max(64).optional(),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: searchSchema,
  component: Checkout,
  head: () => ({ meta: [{ title: "Checkout — Shmalltym Data Plug" }] }),
});

function Checkout() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const { data: bundles } = useQuery({
    queryKey: ["bundles-checkout", user?.id ?? "public"],
    queryFn: () => (user ? listMyBundles() : listPublicBundles()),
  });
  const initGuest = useServerFn(initOrderPayment);
  const initAuth = useServerFn(initOrderPaymentAuth);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bundleId, setBundleId] = useState<string | undefined>(search.bundle);
  const [method, setMethod] = useState<"paystack" | "wallet">("paystack");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (search.bundle) setBundleId(search.bundle); }, [search.bundle]);

  const bundle = (bundles ?? []).find((b) => b.id === bundleId);
  const canUseWallet = user && (roles.includes("agent") || roles.includes("reseller"));

  const submit = async () => {
    if (!bundleId) { toast.error("Pick a bundle"); return; }
    if (!/^[0-9+ ]{7,20}$/.test(phone)) { toast.error("Enter a valid phone number"); return; }
    setBusy(true);
    try {
      if (user) {
        const res = await initAuth({ data: { bundleId, recipientPhone: phone, method } });
        if (res.paid) {
          toast.success("Order paid from wallet");
          navigate({ to: "/track/$orderId", params: { orderId: res.orderId } });
        } else if (res.authorization_url) {
          window.location.href = res.authorization_url;
        }
      } else {
        const res = await initGuest({ data: {
          bundleId, recipientPhone: phone,
          customerName: name || undefined, customerEmail: email || undefined,
          agentSlug: search.agent,
        } });
        window.location.href = res.authorization_url;
      }
    } catch (e: any) {
      toast.error(e.message || "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Checkout</h1>
        <p className="mt-2 text-muted-foreground">Pay with Mobile Money or card. Powered by Paystack.</p>

        <Card className="mt-8 p-6">
          <Label className="text-sm font-semibold">Select bundle</Label>
          {(() => {
            const groups = new Map<string, { name: string; color: string | null; items: typeof bundles }>();
            for (const b of bundles ?? []) {
              if (!groups.has(b.network_code)) groups.set(b.network_code, { name: b.network_name, color: b.network_color, items: [] as any });
              groups.get(b.network_code)!.items!.push(b);
            }
            for (const g of groups.values()) g.items!.sort((a, b) => a.size_mb - b.size_mb);
            return (
              <div className="mt-3 space-y-5">
                {Array.from(groups.entries()).map(([code, g]) => (
                  <div key={code}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-md" style={{ background: g.color ?? "#FFCC00" }}>
                        <Zap className="h-3.5 w-3.5 text-foreground" />
                      </span>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.name}</div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {g.items!.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBundleId(b.id)}
                          className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${bundleId === b.id ? "border-secondary bg-secondary/10" : "border-border hover:border-secondary/50"}`}
                        >
                          <div className="text-sm font-semibold">{b.label}</div>
                          <div className="font-display text-base font-bold">GH₵{b.price.toFixed(2)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="mt-6 grid gap-4">
            <div>
              <Label htmlFor="phone">Recipient phone *</Label>
              <Input id="phone" inputMode="tel" placeholder="0241234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {!user && (
              <>
                <div>
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email">Email (for receipt)</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </>
            )}

            {canUseWallet && (
              <div>
                <Label className="text-sm font-semibold">Payment method</Label>
                <RadioGroup value={method} onValueChange={(v) => setMethod(v as any)} className="mt-2">
                  <div className="flex items-center gap-2"><RadioGroupItem value="paystack" id="m1" /><Label htmlFor="m1">Paystack (MoMo / card)</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="wallet" id="m2" /><Label htmlFor="m2">My wallet balance</Label></div>
                </RadioGroup>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-muted px-4 py-3">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="font-display text-2xl font-bold">{bundle ? `GH₵${bundle.price.toFixed(2)}` : "—"}</div>
          </div>

          <Button className="mt-5 w-full" size="lg" disabled={busy || !bundleId} onClick={submit}>
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</> : "Pay now"}
          </Button>
        </Card>
      </section>
    </SiteLayout>
  );
}
