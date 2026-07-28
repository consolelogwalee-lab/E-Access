"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, HandCoins, X } from "lucide-react";
import { naira } from "@/lib/format";

type Offer = {
  id: number; listing_id: number; amount: number | string; message: string | null;
  status: string; created_at: string; listing_title: string; asking_price: number | string;
  location_area: string; location_city: string; buyer_name: string; buyer_email: string;
};

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch("/api/offers").then((r) => r.json()).then((d) => setOffers(d.offers ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function resolve(id: number, status: "accepted" | "declined") {
    setBusy(id);
    await fetch("/api/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBusy(null);
    load();
  }

  const pct = (offer: Offer) => {
    const a = Number(offer.amount), p = Number(offer.asking_price);
    if (!p) return "";
    const d = Math.round((a / p) * 100);
    return `${d}% of asking`;
  };

  return (
    <div>
      <h1 className="h3 text-neutral-900">Offers</h1>
      <p className="body-md mt-1 text-neutral-500">
        Purchase offers from buyers. Accepting or declining notifies the buyer instantly.
      </p>

      <div className="mt-6 space-y-2">
        {offers === null && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
        {offers?.length === 0 && (
          <div className="flex h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60">
            <HandCoins size={28} className="text-neutral-300" />
            <p className="body-md mt-3 text-neutral-400">No offers yet.</p>
          </div>
        )}
        {offers?.map((o) => (
          <div key={o.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-brand-500">{naira(Number(o.amount))}</span>
                  <span className="text-xs text-neutral-400">({pct(o)}, asking {naira(Number(o.asking_price))})</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                    o.status === "pending" ? "bg-amber-50 text-amber-700" :
                    o.status === "accepted" ? "bg-lime-50 text-lime-700" : "bg-neutral-100 text-neutral-500"
                  }`}>{o.status}</span>
                </div>
                <div className="mt-1 truncate text-sm font-medium text-neutral-800">{o.listing_title}</div>
                <div className="text-xs text-neutral-400">{o.location_area}, {o.location_city} • from {o.buyer_name} ({o.buyer_email})</div>
                {o.message && <p className="body-md mt-2 max-w-[560px] text-neutral-600">&ldquo;{o.message}&rdquo;</p>}
              </div>
              {o.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => resolve(o.id, "accepted")}
                    disabled={busy === o.id}
                    className="btn-text flex h-10 items-center gap-1.5 rounded-full bg-lime-600 px-4 text-white transition hover:bg-lime-700 disabled:opacity-50"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    onClick={() => resolve(o.id, "declined")}
                    disabled={busy === o.id}
                    className="btn-text flex h-10 items-center gap-1.5 rounded-full bg-neutral-100 px-4 text-neutral-700 transition hover:bg-neutral-200 disabled:opacity-50"
                  >
                    <X size={14} /> Decline
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
