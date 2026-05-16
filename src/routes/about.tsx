import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({ meta: [{ title: "About — Shmalltym Data Plug" }] }),
});

function About() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-bold">About Shmalltym Data Plug</h1>
        <p className="mt-4 text-muted-foreground">We make it ridiculously easy to buy MTN, Telecel and AirtelTigo data bundles in Ghana. Tap, pay, get data.</p>
        <p className="mt-3 text-muted-foreground">Our agent and reseller program lets anyone start their own data business with no upfront cost beyond a one‑time GH₵30 fee.</p>
        <h2 className="mt-10 font-display text-2xl font-bold">Why us?</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
          <li>Fast, secure Paystack checkout (MoMo, card, bank).</li>
          <li>Real‑time order tracking with auto‑refresh.</li>
          <li>Agent storefronts with personal links and custom pricing.</li>
          <li>Wallet top‑ups for resellers and agents.</li>
        </ul>
      </section>
    </SiteLayout>
  );
}
