"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Trash2, BadgeCheck, ArrowRight } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { getCart, removeFromCart, clearCart, CART_EVENT, type CartItem } from "@/lib/cart";
import { naira } from "@/lib/format";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => setItems(getCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    return () => window.removeEventListener(CART_EVENT, sync);
  }, []);

  const total = items.reduce((s, i) => s + Number(i.price), 0);

  async function beginPurchase() {
    if (busy || !items.length) return;
    setBusy(true);
    for (const i of items) {
      await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: i.id,
          message: `I'd like to begin the purchase process for "${i.title}" (${naira(i.price)}). Please contact me with the next steps, documentation review, and payment structure.`,
        }),
      }).catch(() => {});
    }
    clearCart();
    setBusy(false);
    setDone(true);
  }

  return (
    <div>
      <Topbar crumbs={[["Main", "/dashboard"], ["Cart", ""]]} showRegion={false} searchPlaceholder="Search listings" />
      <h1 className="h3 mt-6 text-neutral-900">Your Cart</h1>

      {done ? (
        <div className="mt-6 flex h-[360px] flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-100">
            <BadgeCheck size={32} className="text-lime-600" />
          </span>
          <p className="h4 mt-5 text-neutral-800">Purchase process started</p>
          <p className="body-md mt-1 max-w-[400px] text-neutral-400">
            Our consultants have received your interest in each property and will reach out
            through Messages with documentation and next steps.
          </p>
          <Link href="/dashboard/messages" className="btn-text mt-6 flex h-11 items-center gap-2 rounded-xl bg-brand-900 px-6 text-white hover:bg-brand-500">
            Open Messages <ArrowRight size={15} />
          </Link>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 flex h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
          <ShoppingBag size={28} className="text-neutral-300" />
          <p className="h4 mt-3 text-neutral-700">Your cart is empty</p>
          <p className="body-md mt-1 text-neutral-400">Add properties from the home page or Discover.</p>
          <Link href="/dashboard" className="btn-text mt-5 flex h-11 items-center rounded-xl bg-brand-900 px-6 text-white hover:bg-brand-500">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {items.map((i) => (
              <div key={i.id} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.image} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/property/${i.id}`} className="block truncate text-sm font-semibold text-neutral-900 hover:underline">
                    {i.title}
                  </Link>
                  <div className="text-xs text-neutral-400">{i.location}</div>
                  <div className="mt-0.5 text-sm font-bold text-brand-500">{naira(i.price)}</div>
                </div>
                <button onClick={() => removeFromCart(i.id)} className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 hover:border-red-300 hover:text-red-500" aria-label="Remove">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold text-neutral-900">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-400">Properties</dt><dd className="font-medium text-neutral-800">{items.length}</dd></div>
              <div className="flex justify-between border-t border-neutral-100 pt-2"><dt className="text-neutral-400">Estimated total</dt><dd className="text-lg font-bold text-neutral-900">{naira(total)}</dd></div>
            </dl>
            <button
              onClick={beginPurchase}
              disabled={busy}
              className="btn-text mt-5 h-12 w-full rounded-xl bg-brand-900 text-white transition hover:bg-brand-500 disabled:opacity-60"
            >
              {busy ? "Starting…" : "Begin Purchase Process"}
            </button>
            <p className="caption mt-3 text-neutral-400">
              No payment is taken online. This notifies our verified consultants, who will guide
              documentation, inspection, and secure payment for each property.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
