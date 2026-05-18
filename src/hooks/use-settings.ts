import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/lib/settings.functions";

export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings(),
    staleTime: 5 * 60 * 1000,
  });
  return {
    whatsappDmUrl: data?.whatsapp_dm_url || "https://wa.me/233257992603",
    whatsappGroupUrl: data?.whatsapp_group_url || "https://chat.whatsapp.com/",
  };
}
