import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin.from("site_settings").select("key, value");
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return {
    whatsapp_dm_url: map.whatsapp_dm_url || "https://wa.me/233257992603",
    whatsapp_group_url: map.whatsapp_group_url || "https://chat.whatsapp.com/",
    paystack_enabled: map.paystack_enabled || "true",
  };
});

export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        whatsapp_dm_url: z.string().url().max(500),
        whatsapp_group_url: z.string().url().max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const rows = Object.entries(data).map(([key, value]) => ({ key, value }));
    const { error } = await supabaseAdmin.from("site_settings").upsert(rows, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
