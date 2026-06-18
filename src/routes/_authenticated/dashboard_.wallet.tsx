import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { initWalletTopup } from "@/lib/orders.functions";
import { getMyProfile, listMyWalletTransactions } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/dashboard_/wallet")({
  component: Wallet,
  head: () => ({ meta: [{ title: "Wallet — Shmalltym Data Plug" }] }),
});

function Wallet() {
  const { data: profile } = useQuery({ queryKey: ["me"], queryFn: () => getMyProfile() });
  const { data: txns } = useQuery({ queryKey: ["wallet-txns"], queryFn: () => listMyWalletTransactions() });
  const topup = useServerFn(initWalletTopup);
  const [amount, setAmount] = useState(50);
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      const res = await topup({ data: { amount } });
      window.location.href = res.authorization_url;
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Wallet</h1>
        <Card className="mt-4 p-6">
          <div className="text-xs uppercase text-muted-foreground">Balance</div>
          <div className="font-display text-4xl font-bold">GH₵{Number(profile?.profile?.wallet_balance ?? 0).toFixed(2)}</div>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="font-display text-lg font-semibold">Top up</h2>
          <div className="mt-3 flex gap-2">
            {[20, 50, 100, 200, 500].map((v) => (
              <Button key={v} variant={amount === v ? "default" : "outline"} size="sm" onClick={() => setAmount(v)}>GH₵{v}</Button>
            ))}
          </div>
          <div className="mt-3"><Label>Custom amount</Label><Input type="number" min={5} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
          <Button className="mt-4 w-full" disabled={busy} onClick={go}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay GH₵${amount} via Paystack`}
          </Button>
        </Card>

        <h2 className="mt-10 font-display text-xl font-semibold">Recent transactions</h2>
        <div className="mt-3 space-y-2">
          {(txns ?? []).map((t) => (
            <Card key={t.id} className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-semibold">{t.type.replace("_", " ").toUpperCase()}</div>
                <div className="text-xs text-muted-foreground">{t.note} · {new Date(t.created_at).toLocaleString()}</div>
              </div>
              <div className={`font-display font-bold ${Number(t.amount) >= 0 ? "text-secondary" : "text-destructive"}`}>
                {Number(t.amount) >= 0 ? "+" : ""}GH₵{Number(t.amount).toFixed(2)}
              </div>
            </Card>
          ))}
          {(!txns || txns.length === 0) && <Card className="p-6 text-center text-muted-foreground">No transactions yet.</Card>}
        </div>
      </section>
    </SiteLayout>
  );
}
