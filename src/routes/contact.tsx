import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({ meta: [{ title: "Contact — Shmalltym Data Plug" }] }),
});

function Contact() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-bold">Talk to us</h1>
        <p className="mt-2 text-muted-foreground">We're here Mon–Sat, 8am–9pm.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="p-6"><Phone className="h-6 w-6 text-secondary" /><div className="mt-3 font-semibold">Call us</div><a className="text-muted-foreground hover:underline" href="tel:0257992603">0257 992 603</a></Card>
          <Card className="p-6"><MessageCircle className="h-6 w-6 text-secondary" /><div className="mt-3 font-semibold">WhatsApp</div><a className="text-muted-foreground hover:underline" href="https://wa.me/233257992603" target="_blank" rel="noreferrer">+233 257 992 603</a></Card>
          <Card className="p-6 sm:col-span-2"><Mail className="h-6 w-6 text-secondary" /><div className="mt-3 font-semibold">Email</div><a className="text-muted-foreground hover:underline" href="mailto:shmalltym17@gmail.com">shmalltym17@gmail.com</a></Card>
        </div>
      </section>
    </SiteLayout>
  );
}
