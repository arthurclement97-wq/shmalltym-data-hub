import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { findOrdersByPhone } from "@/lib/orders.functions";

export const Route = createFileRoute("/track/")({
  component: TrackIndex,
  head: () => ({ meta: [{ title: "Track order — Shmalltym Data Plug" }] }),
});

function TrackIndex() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const findFn = useServerFn(findOrdersByPhone);

  const search = async () => {
    setBusy(true);
    try {
      const res = await findFn({ data: { recipientPhone: phone, date } });
      setResults(res);
      if (res.length === 0) toast.info("No orders found for that phone & date.");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Track your order</h1>
        <p className="mt-2 text-muted-foreground">Look up by order ID, or by recipient phone & date.</p>

        <Tabs defaultValue="phone" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="phone">Phone + date</TabsTrigger>
            <TabsTrigger value="id">Order ID</TabsTrigger>
          </TabsList>

          <TabsContent value="phone">
            <Card className="p-6 space-y-4">
              <div>
                <Label htmlFor="ph">Recipient phone</Label>
                <Input id="ph" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0241234567" />
              </div>
              <div>
                <Label htmlFor="dt">Order date</Label>
                <Input id="dt" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Button className="w-full" disabled={busy || !phone} onClick={search}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="mr-2 h-4 w-4" /> Find orders</>}
              </Button>
            </Card>

            {results && results.length > 0 && (
              <div className="mt-4 space-y-2">
                {results.map((o) => (
                  <Link key={o.id} to="/track/$orderId" params={{ orderId: o.id }} className="block">
                    <Card className="flex items-center justify-between p-4 hover:border-secondary">
                      <div>
                        <div className="font-semibold">{o.bundle_label} — {o.network_code.toUpperCase()}</div>
                        <div className="text-xs text-muted-foreground">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold">GH₵{Number(o.amount).toFixed(2)}</div>
                        <div className="text-xs uppercase text-muted-foreground">{o.status}</div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="id">
            <Card className="p-6">
              <Label htmlFor="oid">Order ID</Label>
              <Input id="oid" value={id} onChange={(e) => setId(e.target.value)} placeholder="00000000-0000-..." />
              <Button className="mt-4 w-full" onClick={() => id && navigate({ to: "/track/$orderId", params: { orderId: id } })}>
                Track
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}
