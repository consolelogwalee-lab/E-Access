"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, MapPin, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { naira, TYPE_LABEL } from "@/lib/format";
import type { Listing } from "@/components/ListingCard";

type Mine = Listing & { views: number; saves: number; status: string; estate_name: string | null };
type Insp = { id: number; status: string; date: string };

export default function PortfolioPage() {
  const [listings, setListings] = useState<Mine[] | null>(null);
  const [inqCount, setInqCount] = useState(0);
  const [inqByListing, setInqByListing] = useState<Record<number, number>>({});
  const [inspections, setInspections] = useState<Insp[]>([]);

  useEffect(() => {
    fetch("/api/listings?mine=1&perPage=100")
      .then((r) => r.json())
      .then((d) => setListings(d.listings ?? []));
    fetch("/api/inquiries")
      .then((r) => r.json())
      .then((d) => {
        const counts: Record<number, number> = {};
        for (const q of d.inquiries ?? []) counts[q.listing_id] = (counts[q.listing_id] ?? 0) + 1;
        setInqByListing(counts);
        setInqCount((d.inquiries ?? []).length);
      });
    fetch("/api/inspections?owner=1")
      .then((r) => r.json())
      .then((d) => setInspections(d.inspections ?? []));
  }, []);

  const active = (listings ?? []).filter((l) => l.status === "active");
  const verified = (listings ?? []).filter((l) => l.verification_status === "verified");
  const underReview = (listings ?? []).filter((l) => l.verification_status === "under_review");
  const totalValue = active.reduce((s, l) => s + Number(l.price), 0);
  const upcoming = inspections.filter((i) => i.status === "confirmed" || i.status === "pending");
  const cityBreakdown = Object.entries(
    verified.reduce<Record<string, number>>((acc, l) => {
      acc[l.location_city] = (acc[l.location_city] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([city, n]) => `${n} in ${city}`).join(" • ");

  const stats = [
    {
      label: "Portfolio Value",
      value: naira(totalValue),
      sub: `Combined estimated value across ${active.length} active listings`,
      border: "border-blue-400",
      bg: "bg-blue-50",
    },
    {
      label: "Verified Properties",
      value: `${verified.length} Properties`,
      sub: cityBreakdown || "Verification pending on new listings",
      border: "border-neutral-800",
      bg: "bg-white",
    },
    {
      label: "Secured Documents",
      value: `${(listings ?? []).length * 3} Documents`,
      sub: "Survey plans, receipts, verification records, and titles",
      border: "border-lime-500",
      bg: "bg-white",
    },
    {
      label: "Inspections & Activity",
      value: `${upcoming.length} Upcoming Inspection${upcoming.length === 1 ? "" : "s"}`,
      sub: upcoming.length ? `Next inspection scheduled for ${upcoming[0]?.date}` : "No inspections scheduled yet",
      border: "border-orange-400",
      bg: "bg-white",
    },
    {
      label: "Pending Reviews",
      value: `${underReview.length} Active Request${underReview.length === 1 ? "" : "s"}`,
      sub: "Additional documentation requested for ownership verification",
      border: "border-red-400",
      bg: "bg-white",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      <Topbar />
      <h1 className="h3 mt-6 text-neutral-900">Your Portfolio</h1>

      {/* Stat cards */}
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scroll-thin">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`flex min-h-[150px] w-[240px] shrink-0 flex-col justify-between rounded-2xl border-2 ${s.border} ${s.bg} p-4`}
          >
            <div className="caption text-neutral-500">{s.label}</div>
            <div>
              <div className="text-lg font-bold leading-6 text-brand-500">{s.value}</div>
              <div className="body-r mt-1 text-neutral-500">{s.sub}</div>
            </div>
            <span className="mt-2 flex h-7 w-7 items-center justify-center self-end rounded-full bg-neutral-100">
              <ArrowRight size={13} className="text-neutral-500" />
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <span className="label-lg text-neutral-900">Your Listings</span>
        <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-500">All Listings</span>
      </div>

      {listings === null ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-white" />)}</div>
      ) : listings.length === 0 ? (
        <div className="mt-4 flex h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
          <p className="h4 text-neutral-700">No listings yet</p>
          <p className="body-md mt-1 text-neutral-400">Add your first property to start the verification process.</p>
          <Link href="/dashboard/portfolio/new" className="btn-text mt-5 flex h-11 items-center gap-2 rounded-xl bg-brand-900 px-6 text-white hover:bg-brand-500">
            <Plus size={16} /> Add Listing
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {listings.map((l) => (
            <div key={l.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/property-${l.image_seed}.svg`} alt="" className="aspect-[16/8] w-full object-cover" />
                <div className="absolute right-3 top-3 flex gap-1.5">
                  {l.verification_status === "verified" ? (
                    <>
                      <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-lime-600">✓ Verified</span>
                      <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                        {l.status === "active" ? "Published" : l.status}
                      </span>
                    </>
                  ) : (
                    <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-orange-500">
                      {l.verification_status === "under_review" ? "Under Review" : "Unverified"}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="text-sm font-semibold text-neutral-900">{l.estate_name ?? l.title}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                  <MapPin size={12} /> {l.location_area}, {l.location_city}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2">
                  <span className="text-xs text-neutral-400">
                    {TYPE_LABEL[l.property_type]}
                    {l.land_size_sqm ? ` • ${l.land_size_sqm} sqm` : ""}
                    {l.bedrooms ? ` • ${l.bedrooms} Bedroom` : ""}
                  </span>
                  <span className="text-sm font-bold text-brand-500">{naira(l.price)}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/dashboard/portfolio/${l.id}`}
                    className="flex h-9 flex-1 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white transition hover:bg-brand-900"
                  >
                    View Listing
                  </Link>
                  <Link
                    href={`/dashboard/portfolio/${l.id}?tab=Inquiries`}
                    className="flex h-9 flex-1 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-200"
                  >
                    Inquiries{inqByListing[l.id] ? ` (${inqByListing[l.id]})` : ""}
                  </Link>
                  <Link href={`/dashboard/portfolio/${l.id}?edit=1`} className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 hover:text-neutral-900">
                    <Pencil size={14} />
                  </Link>
                  <button
                    onClick={async () => {
                      await fetch(`/api/listings/${l.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: l.status === "archived" ? "active" : "archived" }),
                      });
                      setListings((cur) => (cur ?? []).map((x) => x.id === l.id ? { ...x, status: x.status === "archived" ? "active" : "archived" } : x));
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 hover:border-red-300 hover:text-red-600"
                    title={l.status === "archived" ? "Unarchive" : "Archive"}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/dashboard/portfolio/new"
        aria-label="Add listing"
        className="fixed bottom-8 right-8 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-brand-900 text-white shadow-xl shadow-brand-900/30 transition hover:bg-brand-500"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}
