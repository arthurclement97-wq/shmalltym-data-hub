
# Shmalltym Data Plug — Build Plan

A data bundle storefront for MTN, Telecel (Vodafone), and AirtelTigo with customer checkout, reseller/agent tiers, Paystack payments (card + Mobile Money), wallet top-ups, order tracking, and admin tools.

## Brand
- **Name:** Shmalltym Data Plug
- **Contact:** 0257 992 603 · shmalltym17@gmail.com
- **Direction:** Bold Ghanaian Tech — navy `#0A2540`, emerald `#00C896`, gold `#FFD23F`, cloud `#F7F9FC`. Confident, fintech-grade.

## Pages
**Public**
- `/` Home — hero, "Buy data in 30 seconds", network logos, popular bundles, agent CTA, trust strip
- `/bundles` Browse by network + size, instant search/filter
- `/checkout` Phone, network, bundle, pay
- `/track/:orderId` Order tracking (timeline, auto-refresh every 10s)
- `/become-agent` Pitch + GHS 30 signup flow
- `/store/:agentSlug` Public agent storefront with agent's prices
- `/about`, `/contact`, `/faq`, `/login`, `/signup`

**Customer (auth)**
- `/account` Orders, profile, saved numbers

**Reseller / Agent (auth)**
- `/dashboard` Wallet balance, quick order, stats
- `/dashboard/wallet` Top up via Paystack (card/MoMo), transaction history
- `/dashboard/orders` Order history
- `/dashboard/store` (agent only) Storefront settings, custom prices, share link

**Admin**
- `/admin` KPIs, revenue, today's orders
- `/admin/orders` All orders, filter, manual mark-paid/cancel
- `/admin/users` Promote roles, set per-user pricing tier, adjust wallets
- `/admin/bundles` CRUD bundles + base prices per network
- `/admin/pricing` Per-user price overrides (you confirmed admin sets pricing)
- `/admin/payments` Paystack transactions log

## Roles & access
- `customer` (default), `reseller`, `agent`, `admin` — stored in `user_roles` table with `has_role()` security-definer function.
- GHS 30 one-time signup to become reseller or agent (Paystack).
- Agent perks: own storefront `/store/:slug`, set own retail prices, wholesale cost from admin override.

## Order flow
1. Customer/agent picks bundle → enters recipient phone → pays.
2. Payment options: Paystack (card or MoMo) for customers; resellers/agents can also pay from **wallet balance** (topped up via Paystack).
3. Order created `pending` → Paystack webhook → `paid` → admin/auto-fulfill → `completed`. `cancelled` if failed.
4. Tracking page polls every 10s with status timeline.

## Payments (Paystack)
- Initialize transaction from server function, return `authorization_url`.
- Webhook at `/api/public/paystack-webhook` verifies HMAC-SHA512 with secret, then credits wallet or marks order paid.
- Two flows: **order payment** (one-shot) and **wallet top-up** (resellers/agents).

## Technical details

**Stack:** TanStack Start + Lovable Cloud (Supabase) + Paystack.

**Database tables:**
- `profiles` (id, full_name, phone, signup_paid_at, agent_slug, agent_store_name, wallet_balance)
- `user_roles` (user_id, role) — enum: customer/reseller/agent/admin
- `networks` (id, name, code, logo)
- `bundles` (id, network_id, size_mb, label, base_price, validity, active)
- `price_overrides` (user_id, bundle_id, price) — admin per-user pricing
- `orders` (id, user_id, agent_id nullable, recipient_phone, bundle_id, network, amount, status, paystack_ref, created_at, paid_at, completed_at)
- `order_events` (order_id, status, note, created_at) — timeline
- `wallet_transactions` (user_id, type [topup/spend/refund/signup_fee], amount, balance_after, paystack_ref, order_id, created_at)

RLS: users see only their rows; admins via `has_role(auth.uid(),'admin')`; public read on `networks`, `bundles`, agent storefronts.

**Server functions** (`createServerFn`):
- `paystack.initOrder`, `paystack.initWalletTopup`, `paystack.initAgentSignup`
- `orders.create`, `orders.payFromWallet`, `orders.getStatus`
- `agent.updateStorefront`, `agent.getByslug`
- `admin.*` (orders list, set role, set price override, adjust wallet, bundle CRUD)

**Server routes:**
- `/api/public/paystack-webhook` — HMAC-verified, idempotent by `paystack_ref`.

**Auth:** Lovable Cloud email/password + Google. Trigger creates `profiles` row + default `customer` role on signup.

**Secrets needed:** `PAYSTACK_SECRET_KEY` (requested via secret form after Cloud is enabled).

**Order tracking auto-refresh:** TanStack Query with `refetchInterval: 10000` while status is non-terminal.

## Build sequence
1. Enable Lovable Cloud, create schema, RLS, trigger.
2. Auth (email + Google), role system, signup-fee flow.
3. Public site (home, bundles, become-agent, agent storefront).
4. Checkout + Paystack init + webhook + order tracking page.
5. Reseller/Agent dashboard + wallet top-up + pay-from-wallet.
6. Admin dashboard (orders, users, bundles, pricing, payments).
7. SEO meta on every route, contact info in footer.

## Out of scope (ask before adding)
- Automatic data delivery to networks (no public API for GH networks without a vendor); orders are marked `paid` and you fulfill manually from admin, or we wire a vendor API later.
- SMS notifications (can add via Twilio/Hubtel later).
- Mobile app.

Ready to build on approval.
