"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { naira, TYPE_LABEL } from "@/lib/format";
import type { Listing } from "@/components/ListingCard";

const AUTO_MS = 6000;

export function Featured({ listings }: { listings: (Listing & { estate_name: string | null })[] }) {
  const [active, setActive] = useState(Math.min(3, Math.max(0, Math.floor(listings.length / 2))));
  const pausedUntil = useRef(0);

  // Auto-advance like a display case: every ~6s the next property slides into focus
  useEffect(() => {
    if (listings.length < 2) return;
    const t = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setActive((a) => (a + 1) % listings.length);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [listings.length]);

  function pick(i: number) {
    pausedUntil.current = Date.now() + 15000; // pause auto-play briefly after manual pick
    setActive(i);
  }

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
            {[3, 2, 1].map((off) => {
              const i = (active - off + listings.length * 3) % listings.length;
              const l = listings[i];
              if (!l || i === active) return null;
              return (
                <button key={`${l.id}-${off}`} onClick={() => pick(i)} className="group relative h-[140px] w-[120px] shrink-0 overflow-hidden rounded-md transition-all duration-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/property-${l.image_seed}.svg`} alt={l.title} className="h-full w-full object-cover grayscale transition group-hover:grayscale-0" />
                </button>
              );
            })}
          </div>
          <div className="relative h-[320px] w-full max-w-[410px] shrink-0 overflow-hidden rounded-sm md:h-[434px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={L.id} src={`/images/property-${L.image_seed}.svg`} alt={L.title} className="fade-slide h-full w-full object-cover" />
            {/* progress dots */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {listings.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-5 bg-white" : "w-1.5 bg-white/40"}`} />
              ))}
            </div>
          </div>
          <div className="hidden flex-1 gap-4 md:flex">
            {[1, 2, 3].map((off) => {
              const i = (active + off) % listings.length;
              const l = listings[i];
              if (!l || i === active) return null;
              return (
                <button key={`${l.id}-${off}`} onClick={() => pick(i)} className="group relative h-[140px] w-[120px] shrink-0 overflow-hidden rounded-md transition-all duration-500">
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
