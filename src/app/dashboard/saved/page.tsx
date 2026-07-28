"use client";
import { useCallback, useEffect, useState } from "react";
import { BellRing, Trash2 } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { ListingCard, type Listing } from "@/components/ListingCard";

type Search = { id: number; name: string; filters_json: string; created_at: string };

function describeFilters(json: string): string {
  try {
    const f = JSON.parse(json) as { purpose?: string; types?: string[]; minPrice?: number; maxPrice?: number; location?: string };
    const parts: string[] = [];
    if (f.purpose) parts.push(f.purpose === "rent" ? "For rent" : "For sale");
    if (f.types?.length) parts.push(f.types.join(", "));
    if (f.minPrice) parts.push(`from ₦${(f.minPrice / 1e6).toLocaleString()}m`);
    if (f.maxPrice) parts.push(`up to ₦${(f.maxPrice / 1e6).toLocaleString()}m`);
    if (f.location) parts.push(`in ${f.location}`);
    return parts.length ? parts.join(" • ") : "All new listings";
  } catch { return "All new listings"; }
}

export default function SavedPage() {
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [searches, setSearches] = useState<Search[]>([]);

  const load = useCallback(() => {
    fetch("/api/listings?saved=1&perPage=24")
      .then((r) => r.json())
      .then((d) => setListings((d.listings ?? []).map((l: Listing) => ({ ...l, saved: 1 }))));
    fetch("/api/searches").then((r) => r.json()).then((d) => setSearches(d.searches ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function removeSearch(id: number) {
    await fetch(`/api/searches?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <Topbar />
      <h1 className="h3 mt-6 text-neutral-900">Saved Listings</h1>

      {searches.length > 0 && (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
            <BellRing size={15} className="text-[#E2A600]" /> Saved searches with alerts
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {searches.map((s) => (
              <span key={s.id} className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 py-1.5 pl-4 pr-1.5 text-sm text-neutral-700">
                <span className="font-medium">{s.name}</span>
                <span className="hidden text-xs text-neutral-400 sm:inline">({describeFilters(s.filters_json)})</span>
                <button
                  onClick={() => removeSearch(s.id)}
                  aria-label={`Delete saved search ${s.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {listings === null ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-[350px] animate-pulse rounded-2xl bg-white" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-6 flex h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
          <p className="h4 text-neutral-700">Nothing saved yet</p>
          <p className="body-md mt-1 text-neutral-400">Tap the heart on any listing to keep it here.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((l) => <ListingCard key={l.id} listing={l} comparable />)}
        </div>
      )}
    </div>
  );
}
