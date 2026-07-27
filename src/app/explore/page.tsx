"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { ListingCard, type Listing } from "@/components/ListingCard";

const PRICE_BANDS = [
  { label: "Under 5m", min: "", max: "5000000" },
  { label: "5 – 50m", min: "5000000", max: "50000000" },
  { label: "50 – 150m", min: "50000000", max: "150000000" },
  { label: "150m+", min: "150000000", max: "" },
];
const TYPES = ["apartment", "land", "duplex", "commercial"];

function ExploreInner() {
  const sp = useSearchParams();
  const [purpose, setPurpose] = useState(sp.get("purpose") ?? "sale");
  const [location, setLocation] = useState(sp.get("location") ?? "");
  const [search, setSearch] = useState("");
  const [band, setBand] = useState(() =>
    PRICE_BANDS.findIndex((b) => b.min === (sp.get("minPrice") ?? "") && b.max === (sp.get("maxPrice") ?? ""))
  );
  const [types, setTypes] = useState<string[]>(sp.get("type")?.split(",").filter(Boolean) ?? []);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ listings: Listing[]; total: number; perPage: number }>({
    listings: [], total: 0, perPage: 9,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set("purpose", purpose);
    if (location) p.set("location", location);
    if (search) p.set("search", search);
    if (band >= 0) {
      if (PRICE_BANDS[band].min) p.set("minPrice", PRICE_BANDS[band].min);
      if (PRICE_BANDS[band].max) p.set("maxPrice", PRICE_BANDS[band].max);
    }
    if (types.length) p.set("type", types.join(","));
    p.set("page", String(page));
    p.set("perPage", "9");
    const res = await fetch(`/api/listings?${p.toString()}`);
    setData(await res.json());
    setLoading(false);
  }, [purpose, location, search, band, types, page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.max(1, Math.ceil(data.total / (data.perPage || 9)));

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-[1280px] px-6 pb-16 pt-24 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="display text-[32px] text-neutral-900">Explore verified listings</h1>
          <div className="relative w-full md:w-[491px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by location, property type, or estate name"
              className="h-[42px] w-full rounded-full border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-brand-500"
            />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[203px_1fr]">
          {/* Filters */}
          <aside className="space-y-7">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="label-lg text-neutral-900">Listing Purpose</span>
                <button
                  onClick={() => { setPurpose("sale"); setBand(-1); setTypes([]); setLocation(""); setSearch(""); setPage(1); }}
                  className="text-xs font-medium text-support-blue hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className="flex rounded-full bg-neutral-100 p-0.5">
                {(["sale", "rent"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPurpose(p); setPage(1); }}
                    className={`flex-1 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      purpose === p ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
                    }`}
                  >
                    {p === "sale" ? "Buy" : "Rent"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label-lg mb-3 block text-neutral-900">Location</span>
              <div className="relative">
                <input
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                  placeholder="All Nigeria"
                  className="h-10 w-full rounded-xl bg-neutral-100 px-4 pr-8 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
                />
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>

            <div>
              <span className="label-lg mb-3 block text-neutral-900">Price Range</span>
              <div className="flex flex-wrap gap-2">
                {PRICE_BANDS.map((b, i) => (
                  <button
                    key={b.label}
                    onClick={() => { setBand(band === i ? -1 : i); setPage(1); }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      band === i
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label-lg mb-3 block text-neutral-900">Property Type</span>
              <div className="space-y-2">
                {TYPES.map((t) => (
                  <label key={t} className="flex cursor-pointer items-center gap-2.5 text-sm capitalize text-neutral-600">
                    <input
                      type="checkbox"
                      checked={types.includes(t)}
                      onChange={() => {
                        setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
                        setPage(1);
                      }}
                      className="h-4 w-4 rounded border-neutral-300 accent-[#0d06a7]"
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[350px] animate-pulse rounded-2xl bg-neutral-100" />
                ))}
              </div>
            ) : data.listings.length === 0 ? (
              <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 text-center">
                <p className="h4 text-neutral-700">No listings match those filters</p>
                <p className="body-md mt-1 text-neutral-400">Try widening your price range or clearing filters.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.listings.map((l) => (
                  <ListingCard key={l.id} listing={l} href={`/auth?next=/dashboard/property/${l.id}`} />
                ))}
              </div>
            )}

            {pages > 1 && (
              <div className="mt-10 flex items-center justify-between text-sm">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="font-medium text-neutral-600 transition enabled:hover:text-neutral-900 disabled:opacity-30"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pages }).slice(0, 10).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`h-8 w-8 rounded-lg text-sm transition ${
                        page === i + 1 ? "bg-neutral-900 font-semibold text-white" : "text-neutral-500 hover:bg-neutral-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="font-medium text-neutral-600 transition enabled:hover:text-neutral-900 disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreInner />
    </Suspense>
  );
}
