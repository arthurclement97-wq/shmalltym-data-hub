
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('customer','reseller','agent','admin');
CREATE TYPE public.order_status AS ENUM ('pending','paid','completed','cancelled','failed');
CREATE TYPE public.wallet_txn_type AS ENUM ('topup','spend','refund','signup_fee','admin_adjust');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  signup_paid_at TIMESTAMPTZ,
  agent_slug TEXT UNIQUE,
  agent_store_name TEXT,
  agent_tagline TEXT,
  wallet_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Networks
CREATE TABLE public.networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE, -- mtn, telecel, airteltigo
  color TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bundles
CREATE TABLE public.bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  size_mb INT NOT NULL,
  label TEXT NOT NULL,
  base_price NUMERIC(10,2) NOT NULL,
  reseller_price NUMERIC(10,2),
  agent_price NUMERIC(10,2),
  validity TEXT NOT NULL DEFAULT '30 days',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-user price overrides
CREATE TABLE public.price_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, bundle_id)
);

-- Agent custom storefront prices
CREATE TABLE public.agent_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  retail_price NUMERIC(10,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, bundle_id)
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT,
  customer_name TEXT,
  recipient_phone TEXT NOT NULL,
  bundle_id UUID NOT NULL REFERENCES public.bundles(id),
  network_code TEXT NOT NULL,
  bundle_label TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'paystack', -- paystack | wallet
  status public.order_status NOT NULL DEFAULT 'pending',
  paystack_reference TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- Order events (timeline)
CREATE TABLE public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_events_order ON public.order_events(order_id, created_at);

-- Wallet transactions
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.wallet_txn_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  paystack_reference TEXT UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wallet_txn_user ON public.wallet_transactions(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
-- Agent storefront public read handled via security definer in server fn

-- user_roles policies
CREATE POLICY "user_roles_self_select" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- networks/bundles public read
CREATE POLICY "networks_public_read" ON public.networks FOR SELECT USING (true);
CREATE POLICY "networks_admin_write" ON public.networks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bundles_public_read" ON public.bundles FOR SELECT USING (true);
CREATE POLICY "bundles_admin_write" ON public.bundles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- price_overrides admin only + self read
CREATE POLICY "price_overrides_self_read" ON public.price_overrides FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "price_overrides_admin_write" ON public.price_overrides FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- agent_prices: agent manages own; public read for storefront via server fn
CREATE POLICY "agent_prices_self_all" ON public.agent_prices FOR ALL
  USING (auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'));

-- orders
CREATE POLICY "orders_self_select" ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "orders_admin_write" ON public.orders FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- inserts/updates by users handled in server fns with admin client

-- order_events same access pattern
CREATE POLICY "order_events_select" ON public.order_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
    AND (o.user_id = auth.uid() OR o.agent_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- wallet_transactions
CREATE POLICY "wallet_txn_self_select" ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Trigger: create profile + customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed networks
INSERT INTO public.networks (name, code, color, sort_order) VALUES
  ('MTN', 'mtn', '#FFCC00', 1),
  ('Telecel (Vodafone)', 'telecel', '#E60000', 2),
  ('AirtelTigo', 'airteltigo', '#0066B3', 3);

-- Seed placeholder bundles (admin can edit)
WITH n AS (SELECT id, code FROM public.networks)
INSERT INTO public.bundles (network_id, size_mb, label, base_price, reseller_price, agent_price, sort_order)
SELECT n.id, b.size_mb, b.label, b.base_price, b.reseller_price, b.agent_price, b.sort_order
FROM n CROSS JOIN (VALUES
  (500,'500MB', 6.00, 5.50, 5.00, 1),
  (1024,'1GB', 7.00, 6.20, 5.80, 2),
  (2048,'2GB', 13.00, 11.50, 10.80, 3),
  (3072,'3GB', 18.00, 16.00, 15.00, 4),
  (5120,'5GB', 28.00, 25.00, 23.50, 5),
  (10240,'10GB', 52.00, 47.00, 44.00, 6),
  (20480,'20GB', 95.00, 86.00, 80.00, 7),
  (51200,'50GB', 215.00, 198.00, 188.00, 8)
) AS b(size_mb,label,base_price,reseller_price,agent_price,sort_order);
