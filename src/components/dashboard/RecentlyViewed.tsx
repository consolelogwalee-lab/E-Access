"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { naira } from "@/lib/format";
import { listingImage } from "@/lib/images";
import { getRecent } from "@/lib/compare";
import type { Listing } from "@/components/ListingCard";

export function RecentlyViewed() {
  const [items, setItems] = useState<Listing[]>([]);

  useEffect(() => {
    const ids = getRecent();
    if (!ids.length) return;
    fetch(`/api/listings?ids=${ids.join(",")}&perPage=8`)
      .then((r) => r.json())
      .then((d) => {
        const byId = new Map((d.listings ?? []).map((l: Listing) => [l.id, l]));
        setItems(ids.map((id) => byId.get(id)).filter(Boolean).slice(0, 6) as Listing[]);
      })
      .catch(() => {});
  }, []);

  if (!items.length) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
        <History size={15} className="text-neutral-400" /> Recently viewed
      </div>
      <div className="scroll-thin mt-3 flex gap-3 overflow-x-auto pb-2">
        {items.map((l) => (
          <Link
            key={l.id}
            href={`/dashboard/property/${l.id}`}
            className="group w-[210px] shrink-0 rounded-xl border border-neutral-200 bg-white p-1.5 transition hover:shadow-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={listingImage(l)} alt="" className="aspect-[210/120] w-full rounded-lg object-cover" />
            <div className="px-1.5 pb-1 pt-2">
              <div className="text-[13px] font-bold text-brand-500">{naira(Number(l.price))}</div>
              <div className="truncate text-xs text-neutral-500">{l.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
