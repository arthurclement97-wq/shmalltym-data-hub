import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useServerFn } from "@tanstack/react-start";
import { adminListUsers, adminSetUserRole, adminAdjustWallet } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

const ROLES = ["customer", "reseller", "agent", "admin"] as const;

function AdminUsers() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-users"], queryFn: () => adminListUsers() });
  const setRole = useServerFn(adminSetUserRole);
  const adjust = useServerFn(adminAdjustWallet);
  const [search, setSearch] = useState("");

  const filtered = (data ?? []).filter((u) =>
    !search ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || "").includes(search)
  );

  const toggle = async (userId: string, role: any, grant: boolean) => {
    try { await setRole({ data: { userId, role, grant } }); qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Updated"); }
    catch (e: any) { toast.error(e.message); }
  };
  const wallet = async (userId: string) => {
    const v = Number(prompt("Adjustment amount (GH₵, can be negative):") || 0);
    if (!v) return;
    try { await adjust({ data: { userId, delta: v } }); qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Wallet updated"); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Users</h1>
        <Input placeholder="Search name, email, phone" value={search} onChange={(e) => setSearch(e.target.value)} className="w-72" />
      </div>
      <div className="mt-6 space-y-2">
        {filtered.map((u) => (
          <Card key={u.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{u.full_name || "—"}</div>
                <div className="text-xs text-muted-foreground">{u.email} · {u.phone || "no phone"}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(u.roles as string[]).map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase text-muted-foreground">Wallet</div>
                <div className="font-display font-bold">GH₵{Number(u.wallet_balance).toFixed(2)}</div>
                <Button size="sm" variant="outline" className="mt-1" onClick={() => wallet(u.id)}>Adjust</Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const has = (u.roles as string[]).includes(r);
                return (
                  <Button key={r} size="sm" variant={has ? "default" : "outline"} onClick={() => toggle(u.id, r, !has)}>
                    {has ? `✓ ${r}` : `+ ${r}`}
                  </Button>
                );
              })}
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <Card className="p-8 text-center text-muted-foreground">No users.</Card>}
      </div>
    </section>
  );
}
