import { useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";

export function CartButton() {
  const { items, remove, clear, total, count } = useCart();
  const navigate = useNavigate();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Cart" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-[10px] font-bold text-secondary-foreground">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Cart is empty. Add bundles to checkout in bulk.
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((it) => (
                <li key={it.bundleId} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">{it.network}</div>
                    <div className="text-sm font-semibold">{it.label}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-display text-sm font-bold">GH₵{it.price.toFixed(2)}</div>
                    <button onClick={() => remove(it.bundleId)} aria-label="Remove">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t border-border pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-xl font-bold">GH₵{total.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={clear}>
                Clear
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  const ids = items.map((i) => i.bundleId).join(",");
                  navigate({ to: "/checkout", search: { items: ids } });
                }}
              >
                Checkout
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
