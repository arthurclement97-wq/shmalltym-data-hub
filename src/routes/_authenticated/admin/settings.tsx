import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getSiteSettings, updateSiteSettings } from "@/lib/settings.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
  head: () => ({ meta: [{ title: "Site settings — Admin" }] }),
});

function AdminSettings() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ["site-settings-admin"], queryFn: () => getSiteSettings() });
  const update = useServerFn(updateSiteSettings);
  const [dm, setDm] = useState("");
  const [group, setGroup] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) {
      setDm(data.whatsapp_dm_url);
      setGroup(data.whatsapp_group_url);
    }
  }, [data]);

  const save = async () => {
    setBusy(true);
    try {
      await update({ data: { whatsapp_dm_url: dm, whatsapp_group_url: group } });
      toast.success("Settings saved");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Site settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">Update site-wide links without touching code.</p>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg font-semibold">WhatsApp</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <Label htmlFor="dm">WhatsApp DM link</Label>
            <Input id="dm" value={dm} onChange={(e) => setDm(e.target.value)} placeholder="https://wa.me/233..." />
            <p className="mt-1 text-xs text-muted-foreground">Used by the "Chat on WhatsApp" links.</p>
          </div>
          <div>
            <Label htmlFor="group">WhatsApp group link</Label>
            <Input id="group" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="https://chat.whatsapp.com/..." />
            <p className="mt-1 text-xs text-muted-foreground">Used by the "Join WhatsApp group" button.</p>
          </div>
        </div>
        <Button className="mt-6" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
        </Button>
      </Card>
    </section>
  );
}
