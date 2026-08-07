"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, SlidersHorizontal, LayoutGrid, Rows3, X, Bell, BadgeCheck,
} from "lucide-react";
import { LogoFull } from "@/components/Logo";
import { ListingCard, type Listing } from "@/components/ListingCard";
import { CardSkeleton, RowSkeleton } from "@/components/Skeleton";
import { CategoryCards } from "./CategoryCards";
import { FeaturedCarousel } from "./FeaturedCarousel";
import { MobileDock } from "./MobileDock";
import { FloatingMenu } from "./FloatingMenu";

type Props = { authed: boolean; userName: string | null };

const CATEGORIES = [
  { key: "", label: "All" },
  { key: "land", label: "Land" },
  { key: "apartment", label: "Apartment" },
  { key: "duplex", label: "Duplex" },
  { key: "commercial", label: "Commercial" },
];

const PRICE_BANDS = [
  { label: "Under ₦5m", min: "", max: "5000000" },
  { label: "₦5m – 50m", min: "5000000", max: "50000000" },
  { label: "₦50m – 150m", min: "50000000", max: "150000000" },
  { label: "₦150m+", min: "150000000", max: "" },
];

function Explorer({ authed, userName }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [purpose, setPurpose] = useState<"" | "sale" | "rent">("");
  const [category, setCategory] = useState(sp.get("type") ?? "");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [band, setBand] = useState(-1);
  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [debounced, setDebounced] = useState(search);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [perPage, setPerPage] = useState(12);
  const searchRef = useRef<HTMLInputElement>(null);

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const href = (id: number) => (authed ? `/dashboard/property/${id}` : `/listing/${id}`);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (purpose) p.set("purpose", purpose);
    if (category) p.set("type", category);
    if (verifiedOnly) p.set("verified", "1");
    if (band >= 0) {
      if (PRICE_BANDS[band].min) p.set("minPrice", PRICE_BANDS[band].min);
      if (PRICE_BANDS[band].max) p.set("maxPrice", PRICE_BANDS[band].max);
    }
    if (debounced) p.set("search", debounced);
    p.set("perPage", String(perPage));
    const res = await fetch(`/api/listings?${p.toString()}`);
    const d = await res.json();
    setListings(d.listings ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [purpose, category, verifiedOnly, band, debounced, perPage]);

  useEffect(() => { load(); }, [load]);

  const activeChips: { label: string; clear: () => void }[] = [];
  if (verifiedOnly) activeChips.push({ label: "Verified", clear: () => setVerifiedOnly(false) });
  if (purpose) activeChips.push({ label: purpose === "sale" ? "For Sale" : "For Rent", clear: () => setPurpose("") });
  if (category) activeChips.push({ label: CATEGORIES.find((c) => c.key === category)?.label ?? category, clear: () => setCategory("") });
  if (band >= 0) activeChips.push({ label: PRICE_BANDS[band].label, clear: () => setBand(-1) });

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-neutral-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <Link href="/"><LogoFull light size={30} /></Link>
          <div className="hidden flex-1 items-center px-6 md:flex">
            <div className="relative w-full max-w-[520px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by location, property type, or estate name"
                className="h-10 w-full rounded-full border border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={authed ? "/dashboard/notifications" : "/auth/login?next=/dashboard/notifications"}
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 sm:flex"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </Link>
            {authed ? (
              <Link href="/dashboard" className="btn-text rounded-full bg-brand-900 px-4 py-2 text-sm text-white transition hover:bg-brand-500">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-neutral-700 sm:block">
                  Log in
                </Link>
                <Link href="/auth" className="btn-text rounded-full bg-brand-900 px-4 py-2 text-sm text-white transition hover:bg-brand-500">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="dock-pad mx-auto max-w-[1180px] px-4 pt-5 lg:px-8">
        {/* Heading */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold leading-tight text-neutral-900 lg:text-[26px]">
              {authed && userName ? `Welcome back, ${userName.split(" ")[0]}` : "Find verified property across Nigeria"}
            </h1>
            <p className="body-md mt-0.5 text-neutral-500">
              {total ? `${total.toLocaleString()} listings` : "Browse land, homes and commercial spaces"}
            </p>
          </div>
          {/* Grid/List toggle */}
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 bg-white p-1">
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${view === "grid" ? "bg-neutral-900 text-white" : "text-neutral-500"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${view === "list" ? "bg-neutral-900 text-white" : "text-neutral-500"}`}
            >
              <Rows3 size={16} />
            </button>
          </div>
        </div>

        {/* Categories (image tiles) */}
        <div className="mt-4">
          <CategoryCards value={category} onChange={setCategory} />
        </div>

        {/* Filter row */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scroll-thin">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
          <button
            onClick={() => setVerifiedOnly((v) => !v)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${verifiedOnly ? "bg-lime-100 text-lime-700" : "border border-neutral-200 bg-white text-neutral-600"}`}
          >
            <BadgeCheck size={14} /> Verified
          </button>
          {(["sale", "rent"] as const).map((pp) => (
            <button
              key={pp}
              onClick={() => setPurpose((cur) => (cur === pp ? "" : pp))}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${purpose === pp ? "bg-brand-900 text-white" : "border border-neutral-200 bg-white text-neutral-600"}`}
            >
              {pp === "sale" ? "Buy" : "Rent"}
            </button>
          ))}
        </div>

        {/* Expanded price filters */}
        {filtersOpen && (
          <div className="pop-up mt-3 rounded-2xl border border-neutral-200 bg-white p-4">
            <span className="label-lg mb-2 block text-neutral-900">Price range</span>
            <div className="flex flex-wrap gap-2">
              {PRICE_BANDS.map((b, i) => (
                <button
                  key={b.label}
                  onClick={() => setBand(band === i ? -1 : i)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${band === i ? "border-brand-500 bg-brand-500 text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-400"}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeChips.map((c) => (
              <span key={c.label} className="flex items-center gap-1.5 rounded-full bg-support-blue/10 py-1.5 pl-3 pr-2 text-xs font-semibold text-support-blue">
                {c.label}
                <button onClick={c.clear} aria-label={`Remove ${c.label}`} className="flex h-4 w-4 items-center justify-center rounded-full bg-support-blue text-white">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Featured carousel banner */}
        <div className="mt-5">
          <FeaturedCarousel authed={authed} />
        </div>

        {/* Listings feed */}
        <section className="mt-7">
          <h2 className="mb-3 text-base font-bold text-neutral-900">
            {category ? CATEGORIES.find((c) => c.key === category)?.label + " listings" : "All listings"}
          </h2>

          {loading ? (
            view === "grid" ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}
              </div>
            )
          ) : listings.length === 0 ? (
            <div className="flex h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 text-center">
              <p className="h4 text-neutral-700">No listings match those filters</p>
              <p className="body-md mt-1 text-neutral-400">Try clearing a filter or widening the price range.</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {listings.map((l) => <ListingCard key={l.id} listing={l} href={href(l.id)} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((l) => <ListingCard key={l.id} listing={l} href={href(l.id)} variant="row" />)}
            </div>
          )}

          {!loading && listings.length > 0 && listings.length < total && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setPerPage((n) => n + 12)}
                className="btn-text rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-sm text-neutral-700 transition hover:border-neutral-500"
              >
                Show more listings
              </button>
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-neutral-100 py-8 text-center">
          <div className="flex justify-center"><LogoFull light size={26} /></div>
          <p className="mt-3 text-xs text-neutral-400">
            Land. Property. Possibilities. · <Link href="/legal/privacy" className="hover:underline">Privacy</Link> · <Link href="/legal/terms" className="hover:underline">Terms</Link>
          </p>
          <p className="mt-1 text-xs text-neutral-300">© 2026 E-Access. All rights reserved.</p>
        </footer>
      </main>

      {/* Mobile navigation */}
      <MobileDock authed={authed} onMenu={() => setMenuOpen(true)} onSearch={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => searchRef.current?.focus(), 300); }} />
      <FloatingMenu open={menuOpen} onClose={() => setMenuOpen(false)} authed={authed} />

      {/* Mobile search anchor (bottom sheet style focus target lives in header on md+) */}
      <div className="fixed inset-x-0 bottom-[84px] z-30 px-4 md:hidden">
        <div className="relative mx-auto max-w-[440px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search location, type, estate…"
            className="h-11 w-full rounded-full border border-neutral-200 bg-white pl-10 pr-4 text-sm shadow-lg shadow-neutral-900/5 outline-none focus:border-brand-500"
          />
        </div>
      </div>
    </div>
  );
}

export function MarketplaceExplorer(props: Props) {
  return (
    <Suspense>
      <Explorer {...props} />
    </Suspense>
  );
}
