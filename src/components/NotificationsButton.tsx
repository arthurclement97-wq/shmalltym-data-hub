import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { listMyOrders } from "@/lib/orders.functions";
import { useAuth } from "@/hooks/use-auth";

const SEEN_KEY = "shmalltym.notif.seen";

export function NotificationsButton() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["my-orders-notif", user?.id],
    queryFn: () => listMyOrders(),
    enabled: !!user,
    refetchInterval: 30_000,
  });
  const orders = (data ?? []).slice(0, 8);
  const [lastSeen, setLastSeen] = useState<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLastSeen(Number(window.localStorage.getItem(SEEN_KEY) || 0));
  }, []);

  if (!user) return null;

  const unread = orders.filter((o: any) => new Date(o.created_at).getTime() > lastSeen).length;

  const markSeen = () => {
    const now = Date.now();
    window.localStorage.setItem(SEEN_KEY, String(now));
    setLastSeen(now);
  };

  return (
    <Popover onOpenChange={(open) => open && markSeen()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <div className="text-sm font-semibold">Recent activity</div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {orders.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">No orders yet.</div>
          ) : (
            <ul>
              {orders.map((o: any) => {
                const Icon = o.status === "paid" || o.status === "completed" ? CheckCircle2 : o.status === "cancelled" ? XCircle : Clock;
                return (
                  <li key={o.id} className="border-b border-border last:border-0">
                    <Link
                      to="/track/$orderId"
                      params={{ orderId: o.id }}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted"
                    >
                      <Icon className="mt-0.5 h-4 w-4 text-secondary" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{o.bundle_label}</div>
                        <div className="text-xs text-muted-foreground">
                          {o.network_code} · {o.recipient_phone} · {o.status}
                        </div>
                      </div>
                      <div className="text-xs font-semibold">GH₵{Number(o.amount).toFixed(2)}</div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
