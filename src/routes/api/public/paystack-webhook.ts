import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) return new Response("Server misconfigured", { status: 500 });
        const signature = request.headers.get("x-paystack-signature") || "";
        const body = await request.text();
        const expected = createHmac("sha512", secret).update(body).digest("hex");
        try {
          if (!signature || expected.length !== signature.length ||
              !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
            return new Response("Invalid signature", { status: 401 });
          }
        } catch {
          return new Response("Invalid signature", { status: 401 });
        }

        const payload = JSON.parse(body) as {
          event: string;
          data: {
            reference: string;
            amount: number;
            status: string;
            metadata?: Record<string, any>;
          };
        };

        // Only process successful charge events
        if (payload.event !== "charge.success") return new Response("ok");

        const reference = payload.data.reference;
        const amountGhs = payload.data.amount / 100;
        const meta = payload.data.metadata ?? {};
        const kind: string = meta.kind || "order";

        if (kind === "order") {
          const orderId: string | undefined = meta.order_id;
          if (!orderId) return new Response("ok");
          const { data: order } = await supabaseAdmin.from("orders").select("status").eq("id", orderId).maybeSingle();
          if (!order || order.status === "paid" || order.status === "completed") return new Response("ok");
          await supabaseAdmin.from("orders").update({ status: "paid", paid_at: new Date().toISOString(), paystack_reference: reference }).eq("id", orderId);
          await supabaseAdmin.from("order_events").insert({ order_id: orderId, status: "paid", note: "Payment confirmed via Paystack" });
        } else if (kind === "wallet_topup") {
          const userId: string | undefined = meta.user_id;
          if (!userId) return new Response("ok");
          // idempotency: skip if already recorded
          const { data: existing } = await supabaseAdmin.from("wallet_transactions").select("id").eq("paystack_reference", reference).maybeSingle();
          if (existing) return new Response("ok");
          const { data: prof } = await supabaseAdmin.from("profiles").select("wallet_balance").eq("id", userId).maybeSingle();
          const newBalance = Number(prof?.wallet_balance ?? 0) + amountGhs;
          await supabaseAdmin.from("profiles").update({ wallet_balance: newBalance }).eq("id", userId);
          await supabaseAdmin.from("wallet_transactions").insert({
            user_id: userId, type: "topup", amount: amountGhs, balance_after: newBalance,
            paystack_reference: reference, note: "Wallet top-up via Paystack",
          });
        } else if (kind === "agent_signup") {
          const userId: string | undefined = meta.user_id;
          const tier: "reseller" | "agent" = meta.tier;
          if (!userId || !tier) return new Response("ok");
          const { data: existing } = await supabaseAdmin.from("wallet_transactions").select("id").eq("paystack_reference", reference).maybeSingle();
          if (existing) return new Response("ok");
          await supabaseAdmin.from("profiles").update({
            signup_paid_at: new Date().toISOString(),
            agent_slug: meta.slug ?? undefined,
            agent_store_name: meta.store_name ?? undefined,
            agent_tagline: meta.tagline ?? undefined,
          }).eq("id", userId);
          await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: tier as any }, { onConflict: "user_id,role" });
          await supabaseAdmin.from("wallet_transactions").insert({
            user_id: userId, type: "signup_fee", amount: -amountGhs, balance_after: 0,
            paystack_reference: reference, note: `${tier} signup fee`,
          });
        }
        return new Response("ok");
      },
    },
  },
});
