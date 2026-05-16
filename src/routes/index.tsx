import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Zap, ShieldCheck, Wallet, Store, Phone, Clock } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listPublicBundles } from "@/lib/bundles.functions";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Shmalltym Data Plug — Cheap MTN, Telecel & AirtelTigo Bundles in Ghana" },
      { name: "description", content: "Fast, affordable MTN, Telecel and AirtelTigo data bundles. Pay with Mobile Money or card. Become an agent for wholesale prices." },
    ],
  }),
});

function Home() {
  const { data: bundles } = useQuery({
    queryKey: ["public-bundles"],
    queryFn: () => listPublicBundles(),
  });
  const popular = (bundles ?? [])
    .filter((b) => b.network_code === "mtn")
    .slice(0, 4);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="bg-grad-hero text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div>
            <Badge className="bg-accent text-accent-foreground hover:bg-accent">🇬🇭 Made for Ghana</Badge>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Buy data in <span className="text-gradient-gold">30 seconds.</span>
              <br />Pay with MoMo or card.
            </h1>
            <p className="mt-5 max-w-xl text-base text-primary-foreground/80 sm:text-lg">
              Shmalltym Data Plug delivers cheap MTN, Telecel & AirtelTigo bundles straight to any number — instantly.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/bundles">Browse bundles <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/become-agent">Become an agent</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Secured by Paystack</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> Instant delivery</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> 0257 992 603</div>
            </div>
          </div>

          {/* Quick mockup card */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-accent/20 to-secondary/20 blur-2xl" />
            <Card className="relative overflow-hidden p-6">
              <div className="flex items-center justify-between">
                <div className="font-display font-semibold">Quick Order</div>
                <Badge variant="secondary">Live</Badge>
              </div>
              <div className="mt-5 space-y-3">
                {popular.length === 0 && (
                  <div className="space-y-3">
                    {[1,2,3,4].map((i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
                  </div>
                )}
                {popular.map((b) => (
                  <Link
                    key={b.id}
                    to="/checkout"
                    search={{ bundle: b.id }}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-secondary hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: b.network_color ?? "#FFCC00" }}>
                        <Zap className="h-5 w-5 text-foreground" />
                      </span>
                      <div>
                        <div className="font-semibold text-foreground">{b.label} — {b.network_name}</div>
                        <div className="text-xs text-muted-foreground">{b.validity}</div>
                      </div>
                    </div>
                    <div className="font-display text-lg font-bold text-primary">GH₵{b.price.toFixed(2)}</div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Networks strip */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-4 py-8 sm:px-6">
          {["MTN", "Telecel", "AirtelTigo"].map((n) => (
            <div key={n} className="font-display text-xl font-semibold text-muted-foreground">{n}</div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Built for everyone — from buyers to bosses.</h2>
          <p className="mt-3 text-muted-foreground">Three tiers, one platform. Buy a bundle, resell at scale, or run your own data store.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: "Customer", desc: "Buy any bundle in seconds. Pay with MoMo or card. Track delivery live.", cta: "Buy data", to: "/bundles" },
            { icon: Wallet, title: "Reseller — GH₵30", desc: "Top up a wallet, get reduced prices, place orders at wholesale rates.", cta: "Become a reseller", to: "/become-agent" },
            { icon: Store, title: "Agent — GH₵30", desc: "Your own store link, your own prices, lowest tier pricing. Run a real business.", cta: "Become an agent", to: "/become-agent" },
          ].map((b) => (
            <Card key={b.title} className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <b.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
              <Button asChild variant="link" className="mt-4 px-0">
                <Link to={b.to}>{b.cta} <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {[
              { n: "1", t: "Pick a bundle", d: "Choose your network and size." },
              { n: "2", t: "Enter the number", d: "Any MTN, Telecel or AirtelTigo line." },
              { n: "3", t: "Pay securely", d: "MoMo, card or wallet — via Paystack." },
              { n: "4", t: "Get data fast", d: "Track it live until it lands." },
            ].map((s) => (
              <div key={s.n}>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-accent font-display text-lg font-bold text-accent-foreground">{s.n}</div>
                <div className="mt-4 font-display text-lg font-semibold">{s.t}</div>
                <div className="text-sm text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <Card className="overflow-hidden bg-primary p-10 text-primary-foreground">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h3 className="font-display text-3xl font-bold">Run your own data store today.</h3>
              <p className="mt-2 text-primary-foreground/80">Pay GH₵30 once. Get your own link, set your prices, keep the profit.</p>
            </div>
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/become-agent">Get started</Link>
            </Button>
          </div>
        </Card>
      </section>
    </SiteLayout>
  );
}
