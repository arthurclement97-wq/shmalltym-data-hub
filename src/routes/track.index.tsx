import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/track/")({
  component: TrackIndex,
  head: () => ({ meta: [{ title: "Track order — Shmalltym Data Plug" }] }),
});

function TrackIndex() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  return (
    <SiteLayout>
      <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Track your order</h1>
        <p className="mt-2 text-muted-foreground">Paste your order ID from the receipt page.</p>
        <Card className="mt-6 p-6">
          <Label htmlFor="oid">Order ID</Label>
          <Input id="oid" value={id} onChange={(e) => setId(e.target.value)} placeholder="00000000-0000-..." />
          <Button className="mt-4 w-full" onClick={() => id && navigate({ to: "/track/$orderId", params: { orderId: id } })}>
            Track
          </Button>
        </Card>
      </section>
    </SiteLayout>
  );
}
