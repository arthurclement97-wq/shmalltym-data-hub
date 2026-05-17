import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Zap, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { WHATSAPP_GROUP_URL } from "@/lib/contact";

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const isAgent = roles.includes("agent");
  const isReseller = roles.includes("reseller");
  const isAdmin = roles.includes("admin");

  const nav = [
    { to: "/", label: "Home" },
    { to: "/bundles", label: "Bundles" },
    // Hide "Become an Agent" once the user is already an agent
    ...(!isAgent ? [{ to: "/become-agent", label: "Become an Agent" }] : []),
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Shmalltym <span className="text-gradient-gold">Data Plug</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin" })}>
                  Admin
                </Button>
              )}
              {(isAgent || isReseller) && (
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
                  Dashboard
                </Button>
              )}
              {!isAgent && !isReseller && !isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/account" })}>
                  My Account
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => signOut().then(() => navigate({ to: "/" }))}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/login" })}>
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate({ to: "/signup" })}>
                Sign up
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              {user ? (
                <>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setOpen(false);
                      navigate({ to: isAdmin ? "/admin" : isAgent || isReseller ? "/dashboard" : "/account" });
                    }}
                  >
                    {isAdmin ? "Admin" : isAgent || isReseller ? "Dashboard" : "My Account"}
                  </Button>
                  <Button variant="outline" onClick={() => { signOut(); setOpen(false); }}>Sign out</Button>
                </>
              ) : (
                <>
                  <Button className="flex-1" variant="outline" onClick={() => { setOpen(false); navigate({ to: "/login" }); }}>Log in</Button>
                  <Button className="flex-1" onClick={() => { setOpen(false); navigate({ to: "/signup" }); }}>Sign up</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
