import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listAgentStorefront } from "@/lib/bundles.functions";

export const Route = createFileRoute("/store/$slug")({
  component: AgentStore,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Shmalltym Data Plug` },
      { name: "description", content: `Buy data bundles from ${params.slug}.` },
    ],
  }),
});

function AgentStore() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["store", slug],
    queryFn: () => listAgentStorefront({ data: { slug } }),
  });

  if (isLoading) return <SiteLayout><div className="mx-auto max-w-4xl px-4 py-16">Loading…</div></SiteLayout>;
  if (!data) return <SiteLayout><div className="mx-auto max-w-xl px-4 py-32 text-center"><h1 className="font-display text-2xl font-bold">Store not found</h1><p className="mt-2 text-muted-foreground">No agent uses that link.</p></div></SiteLayout>;

  return (
    <SiteLayout>
      <section className="bg-grad-hero text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="text-xs uppercase tracking-wider text-accent">Agent storefront</div>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">{data.agent.name}</h1>
          {data.agent.tagline && <p className="mt-3 max-w-2xl text-primary-foreground/80">{data.agent.tagline}</p>}
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.bundles.map((b) => (
            <Card key={b.id} className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: b.network_color ?? "#FFCC00" }}><Zap className="h-5 w-5" /></span>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">{b.network_name}</div>
                  <div className="font-display text-lg font-semibold">{b.label}</div>
                </div>
              </div>
              <div className="mt-4 font-display text-2xl font-bold text-primary">GH₵{b.price.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{b.validity}</div>
              <Button asChild className="mt-4 w-full">
                <Link to="/checkout" search={{ bundle: b.id, agent: slug }}>Buy now</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
