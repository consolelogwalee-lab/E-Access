"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ShoppingBag, X, Trash2, ArrowRight } from "lucide-react";
import { getCart, removeFromCart, CART_EVENT, type CartItem } from "@/lib/cart";
import { naira } from "@/lib/format";

export function CartButton({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setItems(getCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const total = items.reduce((s, i) => s + Number(i.price), 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="View cart"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:text-white"
      >
        <ShoppingBag size={17} />
        {items.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e9c46a] px-1 text-[9px] font-bold text-[#3a2d0d]">
            {items.length}
          </span>
        )}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[60] bg-neutral-950/40 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
              <h2 className="h4 text-neutral-900">Your Cart <span className="text-neutral-400">({items.length})</span></h2>
              <button onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100">
                <X size={18} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <ShoppingBag size={30} className="text-neutral-300" />
                <p className="h4 mt-4 text-neutral-700">Your cart is empty</p>
                <p className="body-md mt-1 text-neutral-400">
                  Browse the listings and add properties you&apos;re interested in.
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5 scroll-thin">
                  {items.map((i) => (
                    <div key={i.id} className="flex items-center gap-3 rounded-2xl border border-neutral-100 p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/images/property-${i.image_seed}.svg`} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-neutral-800">{i.title}</div>
                        <div className="text-xs text-neutral-400">{i.location}</div>
                        <div className="text-sm font-bold text-brand-500">{naira(i.price)}</div>
                      </div>
                      <button onClick={() => removeFromCart(i.id)} className="text-neutral-300 transition hover:text-red-500" aria-label="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-neutral-100 px-6 py-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Estimated total</span>
                    <span className="text-lg font-bold text-neutral-900">{naira(total)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push(loggedIn ? "/dashboard/cart" : "/auth?next=/dashboard/cart");
                    }}
                    className="btn-text mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-900 text-white transition hover:bg-brand-500"
                  >
                    {loggedIn ? "Continue to Purchase" : "Log in to Continue"} <ArrowRight size={16} />
                  </button>
                  <p className="caption mt-2 text-center text-neutral-400">
                    No payment is taken online — continuing starts the verified purchase process with our consultants.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
