"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  /** Optional primary image path captured at add-time (display only). */
  imagePath?: string | null;
};

type CartContextValue = {
  items: CartItem[];
  /** False until localStorage has been read (avoid empty-state flash). */
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ro_cart_v1";

function readStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  /** `undefined` = not hydrated yet — never write to storage in that state. */
  const [items, setItems] = useState<CartItem[] | undefined>(undefined);

  useEffect(() => {
    setItems(readStoredCart());
  }, []);

  useEffect(() => {
    if (items === undefined) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota / private mode */
    }
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const list = prev ?? [];
      const existing = list.find((p) => p.productId === item.productId);
      if (existing) {
        return list.map((p) =>
          p.productId === item.productId
            ? { ...p, quantity: Math.min(99, p.quantity + item.quantity) }
            : p
        );
      }
      return [...list, item];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => (prev ?? []).filter((p) => p.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      (prev ?? [])
        .map((p) =>
          p.productId === productId
            ? { ...p, quantity: Math.max(1, Math.min(99, quantity)) }
            : p
        )
        .filter((p) => p.quantity > 0)
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const resolved = items ?? [];

  const value = useMemo(
    () => ({
      items: resolved,
      hydrated: items !== undefined,
      addItem,
      removeItem,
      setQuantity,
      clear,
    }),
    [resolved, items, addItem, removeItem, setQuantity, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
