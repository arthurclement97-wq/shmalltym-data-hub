import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/signup")({
  validateSearch: (s) => z.object({ redirect: z.string().optional() }).parse(s),
  component: Signup,
  head: () => ({ meta: [{ title: "Sign up — Shmalltym Data Plug" }] }),
});

function Signup() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}${search.redirect || "/"}`,
        data: { full_name: fullName, phone },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — check your email to confirm");
    navigate({ to: (search.redirect as any) || "/" });
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(res.error.message || "Google sign-in failed");
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Create your account</h1>
        <Card className="mt-6 p-6">
          <div className="space-y-3">
            <div><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0241234567" /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          </div>
          <Button className="mt-5 w-full" disabled={busy} onClick={go}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          </Button>
          <div className="my-4 text-center text-xs text-muted-foreground">— or —</div>
          <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Have an account? <Link to="/login" className="font-semibold text-foreground hover:underline">Log in</Link>
          </p>
        </Card>
      </section>
    </SiteLayout>
  );
}
