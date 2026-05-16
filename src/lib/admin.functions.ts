import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admin only");
}

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [{ count: ordersTotal }, { count: ordersToday }, { data: paidToday }, { count: users }] = await Promise.all([
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("orders").select("amount").gte("created_at", since).eq("status", "paid"),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    ]);
    const revenueToday = (paidToday ?? []).reduce((a, r) => a + Number(r.amount), 0);
    return { ordersTotal: ordersTotal ?? 0, ordersToday: ordersToday ?? 0, revenueToday, users: users ?? 0 };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ status: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    let q = supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status as any);
    const { data: orders } = await q;
    return orders ?? [];
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    orderId: z.string().uuid(),
    status: z.enum(["pending", "paid", "completed", "cancelled", "failed"]),
    note: z.string().max(280).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "paid") patch.paid_at = new Date().toISOString();
    if (data.status === "completed") patch.completed_at = new Date().toISOString();
    if (data.status === "cancelled") patch.cancelled_at = new Date().toISOString();
    const { error } = await supabaseAdmin.from("orders").update(patch).eq("id", data.orderId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("order_events").insert({ order_id: data.orderId, status: data.status, note: data.note ?? `Admin set ${data.status}` });
    return { ok: true };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: profiles } = await supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const rolesByUser = new Map<string, string[]>();
    (roles ?? []).forEach((r) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    return (profiles ?? []).map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] }));
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    role: z.enum(["customer", "reseller", "agent", "admin"]),
    grant: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.grant) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: data.role as any }, { onConflict: "user_id,role" });
    } else {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role as any);
    }
    return { ok: true };
  });

export const adminAdjustWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    delta: z.number().min(-10000).max(10000),
    note: z.string().max(280).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: prof } = await supabaseAdmin.from("profiles").select("wallet_balance").eq("id", data.userId).maybeSingle();
    const balance = Number(prof?.wallet_balance ?? 0) + data.delta;
    if (balance < 0) throw new Error("Would make balance negative");
    await supabaseAdmin.from("profiles").update({ wallet_balance: balance }).eq("id", data.userId);
    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: data.userId, type: "admin_adjust", amount: data.delta, balance_after: balance,
      note: data.note ?? "Admin adjustment",
    });
    return { ok: true, balance };
  });

// Bundle CRUD
export const adminListBundles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const [{ data: bundles }, { data: networks }] = await Promise.all([
      supabaseAdmin.from("bundles").select("*").order("network_id").order("sort_order"),
      supabaseAdmin.from("networks").select("*").order("sort_order"),
    ]);
    return { bundles: bundles ?? [], networks: networks ?? [] };
  });

export const adminSaveBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    network_id: z.string().uuid(),
    size_mb: z.number().int().min(1),
    label: z.string().min(1).max(40),
    base_price: z.number().min(0),
    reseller_price: z.number().min(0).nullable().optional(),
    agent_price: z.number().min(0).nullable().optional(),
    validity: z.string().min(1).max(40).default("30 days"),
    active: z.boolean().default(true),
    sort_order: z.number().int().default(0),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await supabaseAdmin.from("bundles").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("bundles").insert(data);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await supabaseAdmin.from("bundles").delete().eq("id", data.id);
    return { ok: true };
  });

// Price overrides
export const adminListOverrides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data } = await supabaseAdmin.from("price_overrides")
      .select("*").order("created_at", { ascending: false }).limit(500);
    return data ?? [];
  });

export const adminSetOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid(), bundleId: z.string().uuid(), price: z.number().min(0),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("price_overrides").upsert({
      user_id: data.userId, bundle_id: data.bundleId, price: data.price,
    }, { onConflict: "user_id,bundle_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await supabaseAdmin.from("price_overrides").delete().eq("id", data.id);
    return { ok: true };
  });

export const adminListPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data } = await supabaseAdmin.from("wallet_transactions").select("*")
      .order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });
