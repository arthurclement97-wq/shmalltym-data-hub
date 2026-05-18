import { useEffect, useState, useCallback } from "react";

export type CartItem = { bundleId: string; label: string; network: string; price: number };

const KEY = "shmalltym.cart.v1";
const EVT = "shmalltym:cart";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
    const sync = () => setItems(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback((it: CartItem) => {
    const cur = read();
    if (cur.some((c) => c.bundleId === it.bundleId)) return;
    write([...cur, it]);
  }, []);
  const remove = useCallback((bundleId: string) => {
    write(read().filter((c) => c.bundleId !== bundleId));
  }, []);
  const clear = useCallback(() => write([]), []);

  const total = items.reduce((s, i) => s + Number(i.price || 0), 0);
  return { items, add, remove, clear, total, count: items.length };
}
