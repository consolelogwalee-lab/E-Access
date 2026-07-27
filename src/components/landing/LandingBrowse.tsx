"use client";
import { useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { ListingCard, type Listing } from "@/components/ListingCard";

const PRICE_BANDS = [
  { label: "Under 5m", min: 0, max: 5_000_000 },
  { label: "5 – 50m", min: 5_000_000, max: 50_000_000 },
  { label: "50 – 150m", min: 50_000_000, max: 150_000_000 },
  { label: "150m+", min: 150_000_000, max: Infinity },
];
const PER_PAGE = 9;

export function LandingBrowse({ listings }: { listings: Listing[] }) {
  const [purpose, setPurpose] = useState<"sale" | "rent">("sale");
  const [type, setType] = useState("");
  const [band, setBand] = useState(-1);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const bandCounts = useMemo(
    () => PRICE_BANDS.map((b) => listings.filter((l) => Number(l.price) >= b.min && Number(l.price) < b.max).length),
    [listings]
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return listings.filter((l) => {
      if (l.purpose !== purpose) return false;
      if (type && l.property_type !== type) return false;
      if (band >= 0 && !(Number(l.price) >= PRICE_BANDS[band].min && Number(l.price) < PRICE_BANDS[band].max)) return false;
      if (s && ![l.title, l.location_area, l.location_city, (l as Listing & { estate_name?: string }).estate_name ?? ""].join(" ").toLowerCase().includes(s)) return false;
      return true;
    });
  }, [listings, purpose, type, band, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const go = (p: number) => setPage(Math.min(pages, Math.max(1, p)));

  return (
    <section id="browse" className="mx-auto max-w-[1280px] px-6 pb-16 pt-8 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Filters rail */}
        <aside className="space-y-7">
          <div>
            <span className="label-lg mb-3 block text-neutral-900">Listing Purpose</span>
            <div className="space-y-2.5">
              {([["sale", "Buy"], ["rent", "Rent"]] as const).map(([v, l]) => (
                <label key={v} className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-700">
                  <input
                    type="radio"
                    name="purpose"
                    checked={purpose === v}
                    onChange={() => { setPurpose(v); setPage(1); }}
                    className="h-4 w-4 accent-[#0d06a7]"
                  />
                  <span className={purpose === v ? "font-semibold text-support-blue" : ""}>{l}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="label-lg mb-3 block text-neutral-900">Property Type</span>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => { setType(e.target.value); setPage(1); }}
                className="h-11 w-full appearance-none rounded-xl bg-neutral-100 px-4 pr-9 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <option value="">Any type</option>
                <option value="apartment">Apartment</option>
                <option value="land">Land</option>
                <option value="duplex">Duplex</option>
                <option value="commercial">Commercial</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          <div>
            <span className="label-lg mb-3 block text-neutral-900">Price Range</span>
            <div className="space-y-2.5">
              {PRICE_BANDS.map((b, i) => (
                <label key={b.label} className="flex cursor-pointer items-center justify-between text-sm text-neutral-700">
                  <span className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="band"
                      checked={band === i}
                      onChange={() => { setBand(band === i ? -1 : i); setPage(1); }}
                      onClick={() => { if (band === i) { setBand(-1); setPage(1); } }}
                      className="h-4 w-4 accent-[#0d06a7]"
                    />
                    {b.label}
                  </span>
                  <span className="text-xs text-neutral-400">({bandCounts[i].toLocaleString()})</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div>
          <div className="flex items-center">
            <div className="relative flex flex-1 items-center">
              <Search size={15} className="absolute left-4 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by location, property type, or estate name"
                className="h-[42px] w-full rounded-full bg-neutral-100 pl-10 pr-32 text-sm outline-none transition placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-brand-500/30"
              />
              <span className="absolute right-1.5 flex h-[32px] items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-medium text-neutral-700 shadow-sm">
                All Nigeria <ChevronDown size={13} className="text-neutral-400" />
              </span>
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="mt-6 flex h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 text-center">
              <p className="h4 text-neutral-700">No listings match those filters</p>
              <p className="body-md mt-1 text-neutral-400">Try widening your price range or clearing filters.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((l) => (
                <ListingCard key={l.id} listing={l} href={`/auth?next=/dashboard/property/${l.id}`} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="mt-10 flex items-center justify-between text-sm">
              <button onClick={() => go(page - 1)} disabled={page === 1} className="font-medium text-neutral-500 transition enabled:hover:text-neutral-900 disabled:opacity-30">
                ← Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: pages }).map((_, i) => {
                  const p = i + 1;
                  if (pages > 7 && p > 3 && p < pages - 2 && Math.abs(p - page) > 1) {
                    return p === 4 ? <span key={p} className="px-1 text-neutral-400">…</span> : null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => go(p)}
                      className={`h-8 w-8 rounded-lg text-sm transition ${
                        page === p ? "bg-brand-900 font-semibold text-white" : "text-neutral-500 hover:bg-neutral-100"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => go(page + 1)} disabled={page === pages} className="font-medium text-neutral-500 transition enabled:hover:text-neutral-900 disabled:opacity-30">
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
