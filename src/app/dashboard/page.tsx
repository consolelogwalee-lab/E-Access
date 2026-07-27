"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { ListingCard, type Listing } from "@/components/ListingCard";
import { FilterDrawer, EMPTY_FILTERS, PRICE_BANDS, type Filters } from "@/components/dashboard/FilterDrawer";

function DiscoverInner() {
  const sp = useSearchParams();
  const search = sp.get("search") ?? "";
  const [me, setMe] = useState<{ full_name: string } | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [drawer, setDrawer] = useState(false);
  const [sort, setSort] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.user)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (applied.purpose) p.set("purpose", applied.purpose);
    if (applied.types.length) p.set("type", applied.types.join(","));
    if (applied.band >= 0) {
      if (PRICE_BANDS[applied.band].min) p.set("minPrice", PRICE_BANDS[applied.band].min);
      if (PRICE_BANDS[applied.band].max) p.set("maxPrice", PRICE_BANDS[applied.band].max);
    }
    if (applied.location) p.set("location", applied.location);
    if (applied.verifiedOnly) p.set("verified", "1");
    if (applied.minLandSize) p.set("minLandSize", applied.minLandSize);
    if (search) p.set("search", search);
    if (sort) p.set("sort", sort);
    p.set("perPage", "12");
    const res = await fetch(`/api/listings?${p.toString()}`);
    const data = await res.json();
    setListings(data.listings ?? []);
    setLoading(false);
  }, [applied, search, sort]);

  useEffect(() => { load(); }, [load]);

  const tags: { label: string; clear: () => void }[] = [];
  if (applied.purpose) tags.push({ label: applied.purpose === "sale" ? "For Sale" : "For Rent", clear: () => setApplied({ ...applied, purpose: "" }) });
  applied.types.forEach((t) => tags.push({ label: t, clear: () => setApplied({ ...applied, types: applied.types.filter((x) => x !== t) }) }));
  if (applied.band >= 0) tags.push({ label: PRICE_BANDS[applied.band].label, clear: () => setApplied({ ...applied, band: -1 }) });
  if (applied.location) tags.push({ label: applied.location, clear: () => setApplied({ ...applied, location: "" }) });
  if (applied.verifiedOnly) tags.push({ label: "Verified only", clear: () => setApplied({ ...applied, verifiedOnly: false }) });

  return (
    <div>
      <Topbar initialSearch={search} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="h3 text-neutral-900">
          Welcome Back, {me ? me.full_name.split(" ")[0] : "…"}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSort((s) => (s === "" ? "price_asc" : s === "price_asc" ? "price_desc" : ""))}
            className="flex h-[34px] items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-400"
          >
            <ArrowUpDown size={13} />
            {sort === "" ? "Recommended for you" : sort === "price_asc" ? "Price: Low to High" : "Price: High to Low"}
          </button>
          <button
            onClick={() => { setFilters(applied); setDrawer(true); }}
            className="flex h-[34px] items-center gap-2 rounded-full bg-neutral-950 px-4 text-xs font-semibold text-white transition hover:bg-neutral-800"
          >
            <SlidersHorizontal size={13} /> Filters
          </button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {tags.map((t) => (
            <button
              key={t.label}
              onClick={t.clear}
              className="group flex items-center gap-1.5 rounded-full border border-lime-600/25 bg-lime-50 py-1.5 pl-3.5 pr-2 text-xs font-medium capitalize text-lime-600"
            >
              {t.label}
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-600 text-white">
                <X size={10} />
              </span>
            </button>
          ))}
          <button onClick={() => setApplied(EMPTY_FILTERS)} className="text-xs font-medium text-support-blue hover:underline">
            Clear all
          </button>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[350px] animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
            <p className="h4 text-neutral-700">Nothing matches those filters</p>
            <p className="body-md mt-1 text-neutral-400">Try clearing a filter or two.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>

      <FilterDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={() => setApplied(filters)}
      />
    </div>
  );
}

export default function Discover() {
  return <Suspense><DiscoverInner /></Suspense>;
}
