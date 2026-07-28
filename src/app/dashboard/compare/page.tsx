"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { VerificationBadge } from "@/components/Badges";
import { naira } from "@/lib/format";
import { listingImage } from "@/lib/images";
import { getCompare, toggleCompare, COMPARE_EVENT } from "@/lib/compare";
import type { Listing } from "@/components/ListingCard";

type Full = Listing & { toilets: number | null; description: string | null; amenities_json: string | null; purpose: string };

export default function ComparePage() {
  const [listings, setListings] = useState<Full[] | null>(null);

  useEffect(() => {
    const load = () => {
      const ids = getCompare();
      if (!ids.length) { setListings([]); return; }
      fetch(`/api/listings?ids=${ids.join(",")}&perPage=12`)
        .then((r) => r.json())
        .then((d) => {
          const byId = new Map((d.listings ?? []).map((l: Full) => [l.id, l]));
          setListings(ids.map((id) => byId.get(id)).filter(Boolean) as Full[]);
        });
    };
    load();
    window.addEventListener(COMPARE_EVENT, load);
    return () => window.removeEventListener(COMPARE_EVENT, load);
  }, []);

  const rows: [string, (l: Full) => React.ReactNode][] = [
    ["Price", (l) => <span className="text-base font-bold text-brand-500">{naira(Number(l.price))}</span>],
    ["Purpose", (l) => (l.purpose === "rent" ? "For Rent" : "For Sale")],
    ["Type", (l) => <span className="capitalize">{l.property_type}</span>],
    ["Location", (l) => `${l.location_area}, ${l.location_city}`],
    ["Estate", (l) => l.estate_name ?? "—"],
    ["Bedrooms", (l) => l.bedrooms ?? "—"],
    ["Bathrooms", (l) => l.bathrooms ?? "—"],
    ["Land size", (l) => (l.land_size_sqm ? `${l.land_size_sqm} sqm` : "—")],
    ["Verification", (l) => <VerificationBadge status={l.verification_status === "verified" ? "verified" : l.verification_status === "under_review" ? "under_review" : "unverified"} />],
    ["Inspection", (l) => (l.inspection_available ? "Available" : "Not available")],
    ["Documents", (l) => (l.documents_approved ? "Approved" : "In review")],
    ["Amenities", (l) => {
      try {
        const a = JSON.parse(l.amenities_json ?? "[]") as string[];
        return a.length ? a.join(", ") : "—";
      } catch { return "—"; }
    }],
  ];

  return (
    <div>
      <Topbar crumbs={[["Main", "/dashboard"], ["Compare", ""]]} showRegion={false} />
      <div className="mt-6 flex items-center gap-3">
        <Link href="/dashboard" className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50">
          <ArrowLeft size={15} />
        </Link>
        <h1 className="h3 text-neutral-900">Compare Properties</h1>
      </div>

      {listings === null ? (
        <div className="mt-8 h-[400px] animate-pulse rounded-2xl bg-white" />
      ) : listings.length < 2 ? (
        <div className="mt-8 flex h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
          <p className="h4 text-neutral-700">Pick at least two properties</p>
          <p className="body-md mt-1 max-w-[380px] text-neutral-400">
            Use the Compare button on any listing card in Discover, then come back here to see them side by side.
          </p>
          <Link href="/dashboard" className="btn-text mt-5 rounded-full bg-neutral-950 px-5 py-2.5 text-white">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-[140px] border-b border-neutral-100 p-4" />
                {listings.map((l) => (
                  <th key={l.id} className="border-b border-neutral-100 p-4 text-left align-top">
                    <div className="relative">
                      <button
                        onClick={() => toggleCompare(l.id)}
                        aria-label="Remove from comparison"
                        className="absolute -right-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950/80 text-white hover:bg-neutral-950"
                      >
                        <X size={13} />
                      </button>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={listingImage(l)} alt="" className="aspect-[292/180] w-full rounded-xl object-cover" />
                    </div>
                    <Link href={`/dashboard/property/${l.id}`} className="mt-3 block text-[15px] font-semibold leading-6 text-neutral-900 hover:underline">
                      {l.title}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, render]) => (
                <tr key={label} className="odd:bg-neutral-50/60">
                  <td className="p-4 align-top text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</td>
                  {listings.map((l) => (
                    <td key={l.id} className="p-4 align-top text-neutral-700">{render(l)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
