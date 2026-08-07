"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, BadgeCheck } from "lucide-react";
import type { Listing } from "@/components/ListingCard";
import { listingImage } from "@/lib/images";
import { naira } from "@/lib/format";

/**
 * Auto-sliding banner of featured listings (left → right). Real properties, no
 * fake countdowns. Used on the public home and the dashboard Discover page.
 */
export function FeaturedCarousel({ authed }: { authed: boolean }) {
  const [items, setItems] = useState<Listing[]>([]);
  const [idx, setIdx] = useState(0);
  const hover = useRef(false);

  useEffect(() => {
    fetch("/api/listings?featured=1&perPage=8")
      .then((r) => r.json())
      .then((d) => setItems(d.listings ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => {
      if (!hover.current) setIdx((i) => (i + 1) % items.length);
    }, 4000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) {
    return <div className="skeleton h-[168px] w-full rounded-2xl" />;
  }

  const href = (id: number) => (authed ? `/dashboard/property/${id}` : `/listing/${id}`);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => (hover.current = true)}
      onMouseLeave={() => (hover.current = false)}
    >
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {items.map((l) => (
          <Link key={l.id} href={href(l.id)} className="relative block h-[168px] w-full shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.cover_url ?? listingImage(l)} alt={l.title} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <span className="absolute left-3 top-3 rounded-full bg-[#E2A600] px-2.5 py-1 text-[11px] font-bold text-[#3f3005]">Featured</span>
            {l.verification_status === "verified" && (
              <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-lime-700">
                <BadgeCheck size={12} /> Verified
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <div className="text-lg font-bold leading-6">{naira(l.price)}</div>
              <div className="body-md mt-0.5 truncate">{l.title}</div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
                <MapPin size={12} /> {l.location_area}, {l.location_city}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {/* dots */}
      <div className="pointer-events-none absolute bottom-3 right-4 flex gap-1.5">
        {items.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
}
