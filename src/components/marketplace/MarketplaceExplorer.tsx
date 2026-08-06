"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, SlidersHorizontal, LayoutGrid, Rows3, X, Bell, Headset,
  Building2, Trees, Home as HomeIcon, Store, BadgeCheck, ChevronRight,
} from "lucide-react";
import { LogoFull } from "@/components/Logo";
import { ListingCard, type Listing } from "@/components/ListingCard";
import { CardSkeleton, RowSkeleton } from "@/components/Skeleton";
import { listingImage } from "@/lib/images";
import { MobileDock } from "./MobileDock";
import { FloatingMenu } from "./FloatingMenu";

type Props = { authed: boolean; userName: string | null };

const CATEGORIES = [
  { key: "", label: "All", icon: LayoutGrid },
  { key: "land", label: "Land", icon: Trees },
  { key: "apartment", label: "Apartment", icon: Building2 },
  { key: "duplex", label: "Duplex", icon: HomeIcon },
  { key: "commercial", label: "Commercial", icon: Store },
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
  const [featured, setFeatured] = useState<Listing[]>([]);
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

  useEffect(() => {
    fetch("/api/listings?featured=1&perPage=8")
      .then((r) => r.json())
      .then((d) => setFeatured(d.listings ?? []))
      .catch(() => {});
  }, []);

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
          <Link href="/"><LogoFull size={28} /></Link>
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

        {/* Categories */}
        <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1 scroll-thin">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const on = category === c.key;
            return (
              <button
                key={c.key || "all"}
                onClick={() => setCategory(c.key)}
                className={`flex min-w-[80px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 text-xs font-semibold transition ${
                  on ? "border-brand-900 bg-brand-900 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <Icon size={20} />
                {c.label}
              </button>
            );
          })}
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

        {/* Consultant box */}
        <Link
          href={authed ? "/api/consultant/start" : "/auth/login?next=/api/consultant/start"}
          className="mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-900 to-[#2a2f6b] p-4 text-white transition hover:brightness-110"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Headset size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Speak to a Real Estate Consultant</span>
            <span className="block text-xs text-white/70">Get guidance, recommendations, or answers — chat with our team now.</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-white/70" />
        </Link>

        {/* Featured strip */}
        {featured.length > 0 && (
          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900">Featured listings</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scroll-thin">
              {featured.map((l) => (
                <Link
                  key={l.id}
                  href={href(l.id)}
                  className="group w-[230px] shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-lg"
                >
                  <div className="relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={l.cover_url ?? listingImage(l)}
                      alt={l.title}
                      className="aspect-[230/150] w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-[#E2A600] px-2 py-0.5 text-[10px] font-bold text-[#3f3005]">Featured</span>
                  </div>
                  <div className="p-3">
                    <div className="font-bold text-brand-500">{new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(l.price)}</div>
                    <div className="body-md mt-0.5 truncate text-neutral-600">{l.title}</div>
                    <div className="mt-0.5 truncate text-xs text-neutral-400">{l.location_area}, {l.location_city}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

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
          <div className="flex justify-center"><LogoFull size={26} /></div>
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
