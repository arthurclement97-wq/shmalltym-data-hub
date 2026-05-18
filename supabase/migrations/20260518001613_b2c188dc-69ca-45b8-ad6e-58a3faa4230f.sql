CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY site_settings_admin_write ON public.site_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (key, value) VALUES
  ('whatsapp_dm_url', 'https://wa.me/233257992603'),
  ('whatsapp_group_url', 'https://chat.whatsapp.com/')
ON CONFLICT (key) DO NOTHING;