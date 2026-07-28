"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Handshake, MessageCircle } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { naira } from "@/lib/format";
import { listingImage } from "@/lib/images";

type Txn = {
  id: number; listing_id: number; stage: string; note: string | null; created_at: string; updated_at: string;
  listing_title: string; price: number | string; location_area: string; location_city: string;
  property_type: string; image_seed: number; seller_name: string | null;
  agency_name: string | null; seller_whatsapp: string | null; seller_phone: string | null;
};

const STAGES = [
  ["offer_accepted", "Offer Accepted"],
  ["documents_shared", "Documents Shared"],
  ["inspection_done", "Inspection Done"],
  ["agreement_signed", "Agreement Signed"],
  ["completed", "Completed"],
] as const;

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Txn[] | null>(null);

  useEffect(() => {
    fetch("/api/transactions").then((r) => r.json()).then((d) => setTxns(d.transactions ?? []));
  }, []);

  return (
    <div>
      <Topbar crumbs={[["Main", "/dashboard"], ["Transactions", ""]]} showRegion={false} />

      <div className="mt-6">
        <h1 className="text-[25px] font-extrabold tracking-[-0.02em] text-neutral-900">Transactions</h1>
        <p className="body-md mt-1.5 max-w-[560px] text-neutral-500">
          When an offer is accepted, a transaction opens here linking you with the seller or agent.
          The E-Access team tracks each stage until keys change hands. No payments happen on the platform.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {txns === null && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
        {txns?.length === 0 && (
          <div className="flex h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
            <Handshake size={26} className="text-neutral-300" />
            <p className="h4 mt-3 text-neutral-700">No transactions yet</p>
            <p className="body-md mt-1 max-w-[380px] text-neutral-400">
              Make an offer on a property. Once it is accepted, the transaction shows up here.
            </p>
          </div>
        )}
        {txns?.map((t) => {
          const idx = STAGES.findIndex(([k]) => k === t.stage);
          return (
            <div key={t.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={listingImage(t)} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/property/${t.listing_id}`} className="block truncate text-[15px] font-semibold text-neutral-900 hover:underline">
                    {t.listing_title}
                  </Link>
                  <div className="text-xs text-neutral-400">
                    {naira(Number(t.price))} • {t.location_area}, {t.location_city}
                    {t.seller_name ? <> • with {t.agency_name ?? t.seller_name}</> : null}
                  </div>
                  {t.note && <p className="mt-1 text-xs text-neutral-500">Latest: {t.note}</p>}
                </div>
                {t.seller_whatsapp && (
                  <a
                    href={`https://wa.me/${t.seller_whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello, regarding ${t.listing_title} on E-Access…`)}`}
                    target="_blank" rel="noreferrer"
                    className="btn-text flex h-10 items-center gap-2 rounded-full bg-[#25D366] px-4 text-white transition hover:brightness-105"
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                )}
              </div>

              {/* Stage tracker */}
              <div className="mt-5">
                <div className="flex items-center">
                  {STAGES.map(([key, labelText], i) => (
                    <div key={key} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                            i < idx ? "bg-[#1B1F4E] text-white"
                            : i === idx ? "bg-[#E2A600] text-[#1c1503] ring-4 ring-[#E2A600]/20"
                            : "bg-neutral-100 text-neutral-400"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className={`mt-1.5 hidden whitespace-nowrap text-[10px] font-medium sm:block ${i <= idx ? "text-neutral-800" : "text-neutral-400"}`}>
                          {labelText}
                        </span>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div className={`mx-1 mb-4 h-[3px] flex-1 rounded-full sm:mb-0 sm:-mt-4 ${i < idx ? "bg-[#1B1F4E]" : "bg-neutral-100"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
