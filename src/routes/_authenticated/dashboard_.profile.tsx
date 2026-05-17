import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getMyProfile, updateMyProfile, updateMyEmail, updateMyPassword } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/dashboard_/profile")({
  component: Profile,
  head: () => ({ meta: [{ title: "Profile — Shmalltym Data Plug" }] }),
});

function Profile() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => getMyProfile() });
  const updProfile = useServerFn(updateMyProfile);
  const updEmail = useServerFn(updateMyEmail);
  const updPwd = useServerFn(updateMyPassword);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.profile) return;
    setFullName(data.profile.full_name ?? "");
    setPhone(data.profile.phone ?? "");
    setEmail(data.profile.email ?? "");
  }, [data?.profile]);

  const saveProfile = async () => {
    setBusy("profile");
    try {
      await updProfile({ data: { full_name: fullName, phone } });
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };
  const saveEmail = async () => {
    setBusy("email");
    try {
      await updEmail({ data: { email } });
      toast.success("Email updated");
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };
  const savePwd = async () => {
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setBusy("pwd");
    try {
      await updPwd({ data: { password } });
      setPassword("");
      toast.success("Password updated");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const roles = (data?.roles ?? []).join(", ").toUpperCase() || "CUSTOMER";

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold">My profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Roles: {roles}</p>

        <Card className="mt-6 space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Personal info</h2>
          <div><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <Button onClick={saveProfile} disabled={busy === "profile"}>
            {busy === "profile" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </Card>

        <Card className="mt-6 space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Email</h2>
          <p className="text-xs text-muted-foreground">The email you use to sign in (Google or email/password).</p>
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Button onClick={saveEmail} disabled={busy === "email"}>
            {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update email"}
          </Button>
        </Card>

        <Card className="mt-6 space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Password</h2>
          <p className="text-xs text-muted-foreground">Set or change your sign-in password.</p>
          <div><Label>New password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></div>
          <Button onClick={savePwd} disabled={busy === "pwd" || !password}>
            {busy === "pwd" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </Button>
        </Card>
      </section>
    </SiteLayout>
  );
}
