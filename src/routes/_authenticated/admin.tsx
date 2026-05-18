import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/layout/SiteLayout";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminGate,
  head: () => ({ meta: [{ title: "Admin — Shmalltym Data Plug" }] }),
});

function AdminGate() {
  const { roles, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !roles.includes("admin")) navigate({ to: "/" });
  }, [loading, roles, navigate]);
  if (loading || !roles.includes("admin")) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  return (
    <SiteLayout>
      <div className="border-b border-border bg-muted/40">
        <div className="mx-auto flex max-w-7xl gap-4 overflow-x-auto px-4 py-3 text-sm sm:px-6">
          {[
            { to: "/admin", label: "Overview" },
            { to: "/admin/orders", label: "Orders" },
            { to: "/admin/users", label: "Users" },
            { to: "/admin/bundles", label: "Bundles" },
            { to: "/admin/pricing", label: "Pricing" },
            { to: "/admin/payments", label: "Payments" },
            { to: "/admin/settings", label: "Settings" },
          ].map((n) => (
            <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-background hover:text-foreground" activeOptions={{ exact: n.to === "/admin" }} activeProps={{ className: "bg-background text-foreground shadow" }}>
              {n.label}
            </Link>
          ))}
        </div>
      </div>
      <Outlet />
    </SiteLayout>
  );
}
