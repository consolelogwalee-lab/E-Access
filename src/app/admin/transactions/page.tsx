"use client";
import { useCallback, useEffect, useState } from "react";
import { Handshake } from "lucide-react";
import { naira } from "@/lib/format";

type Txn = {
  id: number; listing_id: number; stage: string; note: string | null; updated_at: string;
  listing_title: string; price: number | string; location_area: string; location_city: string;
  buyer_name: string; buyer_email: string; seller_name: string | null;
};

const STAGES = [
  ["offer_accepted", "Offer Accepted"],
  ["documents_shared", "Documents Shared"],
  ["inspection_done", "Inspection Done"],
  ["agreement_signed", "Agreement Signed"],
  ["completed", "Completed"],
] as const;

export default function AdminTransactionsPage() {
  const [txns, setTxns] = useState<Txn[] | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch("/api/transactions").then((r) => r.json()).then((d) => setTxns(d.transactions ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function advance(id: number, stage: string) {
    setBusy(id);
    await fetch("/api/transactions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage, note: notes[id] || null }),
    });
    setBusy(null);
    load();
  }

  return (
    <div>
      <h1 className="h3 text-neutral-900">Transactions</h1>
      <p className="body-md mt-1 text-neutral-500">
        Every accepted offer opens a transaction. Move each one through its stages; both parties are notified at each step. No payments are handled here.
      </p>

      <div className="mt-6 space-y-2">
        {txns === null && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
        {txns?.length === 0 && (
          <div className="flex h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60">
            <Handshake size={26} className="text-neutral-300" />
            <p className="body-md mt-3 text-neutral-400">No transactions yet. Accept an offer to open one.</p>
          </div>
        )}
        {txns?.map((t) => {
          const idx = STAGES.findIndex(([k]) => k === t.stage);
          const next = STAGES[idx + 1];
          return (
            <div key={t.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-neutral-900">{t.listing_title}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  t.stage === "completed" ? "bg-lime-50 text-lime-700" : "bg-blue-50 text-blue-700"
                }`}>{STAGES[idx]?.[1] ?? t.stage}</span>
              </div>
              <div className="mt-1 text-xs text-neutral-400">
                {naira(Number(t.price))} • {t.location_area}, {t.location_city} • Buyer: {t.buyer_name} ({t.buyer_email})
                {t.seller_name ? ` • Seller: ${t.seller_name}` : ""}
              </div>
              {t.note && <p className="mt-1 text-xs text-neutral-500">Latest note: {t.note}</p>}
              {next && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    value={notes[t.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [t.id]: e.target.value })}
                    placeholder="Note to both parties (optional)"
                    className="h-10 min-w-[220px] flex-1 rounded-xl border border-neutral-200 px-3.5 text-sm outline-none focus:border-neutral-400"
                  />
                  <button disabled={busy === t.id} onClick={() => advance(t.id, next[0])}
                    className="btn-text h-10 rounded-full bg-[#1B1F4E] px-5 text-white transition hover:brightness-125 disabled:opacity-50">
                    Advance to: {next[1]}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
