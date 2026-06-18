import { Link } from "@tanstack/react-router";
import { Mail, Phone, Zap, MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-settings";

export function Footer() {
  const { whatsappDmUrl, whatsappGroupUrl } = useSiteSettings();
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Zap className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold">Shmalltym Data Plug</span>
          </div>
          <p className="mt-3 text-sm text-primary-foreground/70">
            Fast, affordable data bundles for MTN, Telecel & AirtelTigo — delivered in minutes.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">Shop</h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li><Link to="/bundles">All bundles</Link></li>
            <li><Link to="/become-agent">Become an Agent</Link></li>
            <li><Link to="/track">Track an order</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">Talk to us</h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> <a href="tel:0257992603">0257 992 603</a></li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> <a href="mailto:shmalltym17@gmail.com">shmalltym17@gmail.com</a></li>
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> <a href={whatsappDmUrl} target="_blank" rel="noreferrer">Chat on WhatsApp</a></li>
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> <a href={whatsappGroupUrl} target="_blank" rel="noreferrer">Join WhatsApp group</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-primary-foreground/60 sm:px-6">
          © {new Date().getFullYear()} Shmalltym Data Plug. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
