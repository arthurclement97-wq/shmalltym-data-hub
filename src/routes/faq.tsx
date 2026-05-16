import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  component: FAQ,
  head: () => ({ meta: [{ title: "FAQ — Shmalltym Data Plug" }] }),
});

const QA = [
  ["How fast do bundles arrive?", "Most orders deliver within 1–5 minutes once payment confirms. Larger packs may take a few minutes longer."],
  ["What networks do you support?", "MTN, Telecel (Vodafone), and AirtelTigo."],
  ["How do I become an agent?", "Sign up, head to Become an Agent, and pay the one‑time GH₵30 fee via Paystack. You'll instantly get reduced prices and your own store link."],
  ["What's the difference between reseller and agent?", "Both pay GH₵30 once and get reduced data prices. Agents additionally get a public storefront link and can set their own retail prices."],
  ["Is my payment secure?", "Yes — all payments are processed by Paystack with PCI‑DSS compliance. We never see your card details."],
  ["Can I get a refund?", "If a bundle fails to deliver and is marked cancelled, we'll refund automatically to your wallet or original method."],
];

function FAQ() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-bold">Frequently asked</h1>
        <Accordion type="single" collapsible className="mt-6">
          {QA.map(([q, a], i) => (
            <AccordionItem key={i} value={String(i)}>
              <AccordionTrigger>{q}</AccordionTrigger>
              <AccordionContent>{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </SiteLayout>
  );
}
