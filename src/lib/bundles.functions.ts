import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CatalogBundle = {
  id: string;
  network_id: string;
  network_code: string;
  network_name: string;
  network_color: string | null;
  size_mb: number;
  label: string;
  base_price: number;
  validity: string;
  price: number; // resolved for caller
};

async function resolvePricesForUser(userId: string | null, agentIdForStore?: string | null): Promise<CatalogBundle[]> {
  const [{ data: nets }, { data: bundles }] = await Promise.all([
    supabaseAdmin.from("networks").select("*").eq("active", true).order("sort_order"),
    supabaseAdmin.from("bundles").select("*").eq("active", true).order("sort_order"),
  ]);
  const netById = new Map((nets ?? []).map((n) => [n.id, n]));

  let overrides: Record<string, number> = {};
  let roles: string[] = [];
  if (userId) {
    const [{ data: po }, { data: r }] = await Promise.all([
      supabaseAdmin.from("price_overrides").select("bundle_id, price").eq("user_id", userId),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    ]);
    overrides = Object.fromEntries((po ?? []).map((p) => [p.bundle_id, Number(p.price)]));
    roles = (r ?? []).map((x) => x.role);
  }

  let agentPrices: Record<string, number> = {};
  if (agentIdForStore) {
    const { data: ap } = await supabaseAdmin
      .from("agent_prices")
      .select("bundle_id, retail_price")
      .eq("agent_id", agentIdForStore)
      .eq("active", true);
    agentPrices = Object.fromEntries((ap ?? []).map((p) => [p.bundle_id, Number(p.retail_price)]));
  }

  return (bundles ?? []).map((b) => {
    const net = netById.get(b.network_id);
    let price = Number(b.base_price);
    if (agentIdForStore) {
      price = agentPrices[b.id] ?? Number(b.base_price);
    } else if (overrides[b.id] != null) {
      price = overrides[b.id];
    } else if (roles.includes("agent") && b.agent_price != null) {
      price = Number(b.agent_price);
    } else if (roles.includes("reseller") && b.reseller_price != null) {
      price = Number(b.reseller_price);
    }
    return {
      id: b.id,
      network_id: b.network_id,
      network_code: net?.code ?? "",
      network_name: net?.name ?? "",
      network_color: net?.color ?? null,
      size_mb: b.size_mb,
      label: b.label,
      base_price: Number(b.base_price),
      validity: b.validity,
      price,
    } satisfies CatalogBundle;
  });
}

export const listPublicBundles = createServerFn({ method: "GET" }).handler(async () => {
  return resolvePricesForUser(null);
});

export const listMyBundles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return resolvePricesForUser(context.userId);
  });

export const listAgentStorefront = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("id, agent_slug, agent_store_name, agent_tagline, full_name")
      .eq("agent_slug", data.slug)
      .maybeSingle();
    if (!prof) return null;
    const bundles = await resolvePricesForUser(null, prof.id);
    return {
      agent: {
        id: prof.id,
        slug: prof.agent_slug,
        name: prof.agent_store_name || prof.full_name || "Data Plug",
        tagline: prof.agent_tagline,
      },
      bundles,
    };
  });
