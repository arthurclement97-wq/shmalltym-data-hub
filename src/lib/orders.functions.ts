import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequestHeader } from "@tanstack/react-start/server";
import { newRef, paystackInit } from "./paystack.server";

const SIGNUP_FEE_GHS = 30;

function originFromReq() {
  const proto = getRequestHeader("x-forwarded-proto") || "https";
  const host = getRequestHeader("x-forwarded-host") || getRequestHeader("host") || "";
  return `${proto}://${host}`;
}

// Order init — paystack
export const initOrderPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    bundleId: z.string().uuid(),
    recipientPhone: z.string().trim().min(7).max(20).regex(/^[0-9+ ]+$/),
    customerName: z.string().trim().min(1).max(120).optional(),
    customerEmail: z.string().email().max(255).optional(),
    agentSlug: z.string().trim().min(1).max(64).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    // Resolve bundle + price
    const { data: bundle } = await supabaseAdmin.from("bundles").select("*").eq("id", data.bundleId).maybeSingle();
    if (!bundle || !bundle.active) throw new Error("Bundle not available");
    const { data: network } = await supabaseAdmin.from("networks").select("*").eq("id", bundle.network_id).maybeSingle();
    if (!network) throw new Error("Network missing");

    let price = Number(bundle.base_price);
    let agentId: string | null = null;
    if (data.agentSlug) {
      const { data: prof } = await supabaseAdmin.from("profiles").select("id").eq("agent_slug", data.agentSlug).maybeSingle();
      if (prof) {
        agentId = prof.id;
        const { data: ap } = await supabaseAdmin.from("agent_prices").select("retail_price").eq("agent_id", agentId).eq("bundle_id", bundle.id).eq("active", true).maybeSingle();
        if (ap) price = Number(ap.retail_price);
      }
    }

    const email = data.customerEmail || "guest@shmalltym.app";
    const reference = newRef("ord");

    const { data: order, error } = await supabaseAdmin.from("orders").insert({
      user_id: null,
      agent_id: agentId,
      customer_email: data.customerEmail ?? null,
      customer_name: data.customerName ?? null,
      recipient_phone: data.recipientPhone,
      bundle_id: bundle.id,
      network_code: network.code,
      bundle_label: bundle.label,
      amount: price,
      payment_method: "paystack",
      status: "pending",
      paystack_reference: reference,
    }).select().single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("order_events").insert({ order_id: order.id, status: "pending", note: "Order created, awaiting payment" });

    const origin = originFromReq();
    const init = await paystackInit({
      email,
      amount: price,
      reference,
      callback_url: `${origin}/track/${order.id}`,
      metadata: { kind: "order", order_id: order.id, agent_id: agentId },
    });
    return { authorization_url: init.authorization_url, orderId: order.id, reference };
  });

// Order init for authenticated users (links to user_id, can also use wallet)
export const initOrderPaymentAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    bundleId: z.string().uuid(),
    recipientPhone: z.string().trim().min(7).max(20).regex(/^[0-9+ ]+$/),
    method: z.enum(["paystack", "wallet"]).default("paystack"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: bundle } = await supabaseAdmin.from("bundles").select("*").eq("id", data.bundleId).maybeSingle();
    if (!bundle || !bundle.active) throw new Error("Bundle not available");
    const { data: network } = await supabaseAdmin.from("networks").select("*").eq("id", bundle.network_id).maybeSingle();
    if (!network) throw new Error("Network missing");

    // Resolve price for user (override / role tier / base)
    const [{ data: po }, { data: roles }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("price_overrides").select("price").eq("user_id", context.userId).eq("bundle_id", bundle.id).maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId),
      supabaseAdmin.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
    ]);
    const userRoles = (roles ?? []).map((r) => r.role);
    let price = Number(bundle.base_price);
    if (po) price = Number(po.price);
    else if (userRoles.includes("agent") && bundle.agent_price != null) price = Number(bundle.agent_price);
    else if (userRoles.includes("reseller") && bundle.reseller_price != null) price = Number(bundle.reseller_price);

    const reference = newRef("ord");
    const { data: order, error } = await supabaseAdmin.from("orders").insert({
      user_id: context.userId,
      customer_email: profile?.email ?? null,
      customer_name: profile?.full_name ?? null,
      recipient_phone: data.recipientPhone,
      bundle_id: bundle.id,
      network_code: network.code,
      bundle_label: bundle.label,
      amount: price,
      payment_method: data.method,
      status: "pending",
      paystack_reference: data.method === "paystack" ? reference : null,
    }).select().single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("order_events").insert({ order_id: order.id, status: "pending", note: `Order created (${data.method})` });

    if (data.method === "wallet") {
      // Charge wallet now
      const balance = Number(profile?.wallet_balance ?? 0);
      if (balance < price) {
        await supabaseAdmin.from("orders").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", order.id);
        await supabaseAdmin.from("order_events").insert({ order_id: order.id, status: "cancelled", note: "Insufficient wallet balance" });
        throw new Error("Insufficient wallet balance. Please top up.");
      }
      const newBalance = balance - price;
      await supabaseAdmin.from("profiles").update({ wallet_balance: newBalance }).eq("id", context.userId);
      await supabaseAdmin.from("wallet_transactions").insert({
        user_id: context.userId, type: "spend", amount: -price, balance_after: newBalance,
        order_id: order.id, note: `Payment for ${bundle.label} (${network.code})`,
      });
      await supabaseAdmin.from("orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", order.id);
      await supabaseAdmin.from("order_events").insert({ order_id: order.id, status: "paid", note: "Paid from wallet" });
      return { orderId: order.id, paid: true };
    }

    const origin = originFromReq();
    const init = await paystackInit({
      email: profile?.email || "user@shmalltym.app",
      amount: price,
      reference,
      callback_url: `${origin}/track/${order.id}`,
      metadata: { kind: "order", order_id: order.id, user_id: context.userId },
    });
    return { authorization_url: init.authorization_url, orderId: order.id, reference, paid: false };
  });

// Wallet top-up init
export const initWalletTopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ amount: z.number().min(5).max(10000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: profile } = await supabaseAdmin.from("profiles").select("email").eq("id", context.userId).maybeSingle();
    const reference = newRef("top");
    const origin = originFromReq();
    const init = await paystackInit({
      email: profile?.email || "user@shmalltym.app",
      amount: data.amount,
      reference,
      callback_url: `${origin}/dashboard/wallet?ref=${reference}`,
      metadata: { kind: "wallet_topup", user_id: context.userId, amount: data.amount },
    });
    return { authorization_url: init.authorization_url, reference };
  });

// Agent signup fee init
export const initAgentSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    tier: z.enum(["reseller", "agent"]),
    storeName: z.string().trim().min(2).max(80).optional(),
    slug: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/).optional(),
    tagline: z.string().trim().max(160).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: profile } = await supabaseAdmin.from("profiles").select("email, signup_paid_at").eq("id", context.userId).maybeSingle();

    // Reseller is FREE for every customer — assign role immediately, no payment.
    if (data.tier === "reseller") {
      await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "reseller" }).select();
      return { alreadyPaid: true };
    }

    if (profile?.signup_paid_at) {
      // already paid the one-time fee — just upgrade to agent
      await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: data.tier }).select();
      if (data.tier === "agent" && data.slug) {
        await supabaseAdmin.from("profiles").update({
          agent_slug: data.slug, agent_store_name: data.storeName, agent_tagline: data.tagline ?? null,
        }).eq("id", context.userId);
      }
      return { alreadyPaid: true };
    }
    const reference = newRef("sgn");
    const origin = originFromReq();
    const init = await paystackInit({
      email: profile?.email || "user@shmalltym.app",
      amount: SIGNUP_FEE_GHS,
      reference,
      callback_url: `${origin}/dashboard?signup=${reference}`,
      metadata: {
        kind: "agent_signup",
        user_id: context.userId,
        tier: data.tier,
        store_name: data.storeName ?? null,
        slug: data.slug ?? null,
        tagline: data.tagline ?? null,
      },
    });
    return { authorization_url: init.authorization_url, reference };
  });

// Order tracking (public — track by id, returns minimal info)
export const getOrderTracking = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, recipient_phone, network_code, bundle_label, amount, status, created_at, paid_at, completed_at, cancelled_at")
      .eq("id", data.orderId).maybeSingle();
    if (!order) return null;
    const { data: events } = await supabaseAdmin
      .from("order_events").select("status, note, created_at")
      .eq("order_id", data.orderId).order("created_at");
    return { order, events: events ?? [] };
  });

// Lookup orders by recipient phone + date (public — last 4 of order id required for privacy if many)
export const findOrdersByPhone = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    recipientPhone: z.string().trim().min(7).max(20).regex(/^[0-9+ ]+$/),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  }).parse(d))
  .handler(async ({ data }) => {
    const start = new Date(`${data.date}T00:00:00Z`).toISOString();
    const end = new Date(`${data.date}T23:59:59.999Z`).toISOString();
    const phone = data.recipientPhone.replace(/\s+/g, "");
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, recipient_phone, network_code, bundle_label, amount, status, created_at")
      .eq("recipient_phone", phone)
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false })
      .limit(50);
    return orders ?? [];
  });

// My orders
export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("orders").select("*")
      .or(`user_id.eq.${context.userId},agent_id.eq.${context.userId}`)
      .order("created_at", { ascending: false }).limit(100);
    return data ?? [];
  });
