import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Zap, Search, ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listPublicBundles, listMyBundles } from "@/lib/bundles.functions";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/bundles")({
  component: Bundles,
  head: () => ({
    meta: [
      { title: "Bundles — Shmalltym Data Plug" },
      { name: "description", content: "Browse all MTN, Telecel and AirtelTigo data bundles. Filter by network and pay securely." },
    ],
  }),
});

function Bundles() {
  const { user } = useAuth();
  const { items: cartItems, add: addToCart } = useCart();
  const { data: bundles } = useQuery({
    queryKey: ["bundles", user?.id ?? "public"],
    queryFn: () => (user ? listMyBundles() : listPublicBundles()),
  });
  const inCart = (id: string) => cartItems.some((c) => c.bundleId === id);
  const [net, setNet] = useState<string>("all");
  const [q, setQ] = useState("");

  const networks = useMemo(() => {
    const s = new Set((bundles ?? []).map((b) => `${b.network_code}|${b.network_name}`));
    return Array.from(s).map((s) => { const [code, name] = s.split("|"); return { code, name }; });
  }, [bundles]);

  const filtered = (bundles ?? []).filter((b) =>
    (net === "all" || b.network_code === net) &&
    (q.length === 0 || b.label.toLowerCase().includes(q.toLowerCase()))
  );

  // Group by network, sorted by size within each group
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; code: string; color: string | null; items: typeof filtered }>();
    for (const b of filtered) {
      const key = b.network_code;
      if (!map.has(key)) map.set(key, { name: b.network_name, code: b.network_code, color: b.network_color, items: [] });
      map.get(key)!.items.push(b);
    }
    for (const g of map.values()) g.items.sort((a, b) => a.size_mb - b.size_mb);
    return Array.from(map.values());
  }, [filtered]);

  return (
    <SiteLayout>
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h1 className="font-display text-4xl font-bold">All bundles</h1>
          <p className="mt-2 text-primary-foreground/70">{user ? "Prices reflect your tier." : "Sign in for reseller/agent pricing."}</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button variant={net === "all" ? "default" : "outline"} size="sm" onClick={() => setNet("all")}>All</Button>
            {networks.map((n) => (
              <Button key={n.code} variant={net === n.code ? "default" : "outline"} size="sm" onClick={() => setNet(n.code)}>
                {n.name}
              </Button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search size, e.g. 5GB" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="mt-8 space-y-10">
          {grouped.map((g) => (
            <div key={g.code}>
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: g.color ?? "#FFCC00" }}>
                  <Zap className="h-5 w-5 text-foreground" />
                </span>
                <h2 className="font-display text-2xl font-bold">{g.name}</h2>
                <span className="text-xs text-muted-foreground">{g.items.length} bundles</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((b) => (
                  <Card key={b.id} className="flex flex-col p-5">
                    <div className="flex items-center justify-between">
                      <div className="font-display text-lg font-semibold">{b.label}</div>
                      <div className="text-xs text-muted-foreground">{b.validity}</div>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div className="font-display text-2xl font-bold text-primary">GH₵{b.price.toFixed(2)}</div>
                      {user && b.price < b.base_price && (
                        <div className="text-xs text-muted-foreground line-through">GH₵{b.base_price.toFixed(2)}</div>
                      )}
                    </div>
                    <div className="mt-5 flex gap-2">
                      <Button asChild className="flex-1">
                        <Link to="/checkout" search={{ bundle: b.id }}>Buy now</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Add to cart"
                        disabled={inCart(b.id)}
                        onClick={() => {
                          addToCart({ bundleId: b.id, label: b.label, network: b.network_name, price: b.price });
                          toast.success(`${b.label} added to cart`);
                        }}
                      >
                        {inCart(b.id) ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          {grouped.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No bundles match.
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
