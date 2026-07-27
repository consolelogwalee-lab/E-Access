"use client";

export type CartItem = {
  id: number;
  title: string;
  price: number;
  image: string;
  location: string;
};

const KEY = "eaccess_cart";
export const CART_EVENT = "eaccess-cart-updated";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

function save(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function addToCart(item: CartItem) {
  const items = getCart();
  if (!items.find((i) => i.id === item.id)) save([...items, item]);
}

export function removeFromCart(id: number) {
  save(getCart().filter((i) => i.id !== id));
}

export function clearCart() {
  save([]);
}

export function inCart(id: number): boolean {
  return getCart().some((i) => i.id === id);
}
