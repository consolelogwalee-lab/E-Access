"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { naira, TYPE_LABEL } from "@/lib/format";
import type { Listing } from "@/components/ListingCard";

export function Featured({ listings }: { listings: (Listing & { estate_name: string | null })[] }) {
  const [active, setActive] = useState(Math.min(3, Math.max(0, Math.floor(listings.length / 2))));
  if (!listings.length) return null;
  const L = listings[active];
  return (
    <section id="featured" className="relative overflow-hidden bg-[#04040a] py-16 text-white">
      <div
        aria-hidden
        className="display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-[62%] select-none whitespace-nowrap text-center text-[18vw] leading-none text-white/[0.13]"
      >
        Featured Properties
      </div>

      <div className="relative mx-auto max-w-[1280px] px-6">
        <div className="mx-auto mb-6 flex max-w-[410px] items-end justify-between">
          <div className="body-md text-white/80">
            <div>{L.estate_name ?? L.title}</div>
            <div className="text-white/55">{L.location_area}, {L.location_city}</div>
          </div>
          <div className="text-lg font-bold">{naira(L.price)}</div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="hidden flex-1 justify-end gap-4 md:flex">
            {listings.slice(0, active).slice(-3).map((l) => {
              const i = listings.indexOf(l);
              return (
                <button key={l.id} onClick={() => setActive(i)} className="group relative h-[140px] w-[120px] shrink-0 overflow-hidden rounded-md opacity-100 transition hover:opacity-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/property-${l.image_seed}.svg`} alt={l.title} className="h-full w-full object-cover grayscale transition group-hover:grayscale-0" />
                </button>
              );
            })}
          </div>
          <div className="relative h-[320px] w-full max-w-[410px] shrink-0 overflow-hidden rounded-sm md:h-[434px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/property-${L.image_seed}.svg`} alt={L.title} className="h-full w-full object-cover" />
          </div>
          <div className="hidden flex-1 gap-4 md:flex">
            {listings.slice(active + 1, active + 4).map((l) => {
              const i = listings.indexOf(l);
              return (
                <button key={l.id} onClick={() => setActive(i)} className="group relative h-[140px] w-[120px] shrink-0 overflow-hidden rounded-md transition">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/property-${l.image_seed}.svg`} alt={l.title} className="h-full w-full object-cover grayscale transition group-hover:grayscale-0" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link href={`/explore?focus=${L.id}`} className="group inline-flex items-center gap-2 text-sm font-medium text-white/90 transition hover:text-white">
            View Details <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-16 flex items-center justify-between text-xs text-white/50">
          <span>{L.inspection_available ? "Inspection Available" : "Inspection On Request"}</span>
          <span>
            {L.land_size_sqm ? `${L.land_size_sqm} sqm • ` : L.bedrooms ? `${L.bedrooms} Bedroom • ` : ""}
            {TYPE_LABEL[L.property_type]}
          </span>
          <span>{L.documents_approved ? "Document Approved" : "Documents In Review"}</span>
        </div>
      </div>
    </section>
  );
}
