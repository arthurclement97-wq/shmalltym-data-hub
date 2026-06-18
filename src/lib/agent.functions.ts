import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const updateAgentStorefront = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    storeName: z.string().trim().min(2).max(80),
    slug: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/),
    tagline: z.string().trim().max(160).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // Ensure agent role
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "agent")) throw new Error("Agent role required");
    // Ensure slug not taken by another
    const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("agent_slug", data.slug).maybeSingle();
    if (existing && existing.id !== context.userId) throw new Error("That store link is taken");
    const { error } = await supabaseAdmin.from("profiles")
      .update({ agent_slug: data.slug, agent_store_name: data.storeName, agent_tagline: data.tagline ?? null })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAgentPrices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin.from("agent_prices").select("*").eq("agent_id", context.userId);
    return data ?? [];
  });

export const upsertAgentPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    bundleId: z.string().uuid(),
    retailPrice: z.number().min(0.5).max(10000),
    active: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "agent")) throw new Error("Agent role required");
    const { error } = await supabaseAdmin.from("agent_prices").upsert({
      agent_id: context.userId, bundle_id: data.bundleId, retail_price: data.retailPrice, active: data.active,
    }, { onConflict: "agent_id,bundle_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
