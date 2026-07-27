"use client";
import Link from "next/link";
import { Heart, MapPin, BedDouble, Bath, Ruler, BadgeCheck, ShoppingBag, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { VerificationBadge } from "./Badges";
import { naira } from "@/lib/format";
import { addToCart, inCart, removeFromCart, CART_EVENT } from "@/lib/cart";
import { listingImage } from "@/lib/images";

export type Listing = {
  id: number;
  title: string;
  purpose: string;
  property_type: string;
  price: number;
  location_area: string;
  location_city: string;
  estate_name: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  land_size_sqm: number | null;
  verification_status: string;
  inspection_available: number;
  documents_approved: number;
  image_seed: number;
  saved?: number;
};

export function ListingCard({
  listing,
  href,
  cartable = false,
}: {
  listing: Listing;
  href?: string;
  cartable?: boolean;
}) {
  const [saved, setSaved] = useState(!!listing.saved);
  const [carted, setCarted] = useState(false);
  const url = href ?? `/dashboard/property/${listing.id}`;

  useEffect(() => {
    if (!cartable) return;
    const sync = () => setCarted(inCart(listing.id));
    sync();
    window.addEventListener(CART_EVENT, sync);
    return () => window.removeEventListener(CART_EVENT, sync);
  }, [cartable, listing.id]);

  function toggleCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (carted) removeFromCart(listing.id);
    else
      addToCart({
        id: listing.id,
        title: listing.title,
        price: Number(listing.price),
        image: listingImage(listing),
        location: `${listing.location_area}, ${listing.location_city}`,
      });
  }

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaved((s) => !s);
    await fetch(`/api/listings/${listing.id}/save`, { method: "POST" }).catch(() => setSaved((s) => !s));
  }

  return (
    <Link
      href={url}
      className="group block rounded-2xl border border-neutral-200 bg-white p-2 transition hover:shadow-lg hover:shadow-neutral-900/5"
    >
      <div className="relative overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listingImage(listing)}
          alt={listing.title}
          className="aspect-[292/200] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <button
          onClick={toggleSave}
          aria-label="Save listing"
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <Heart
            size={17}
            className={saved ? "fill-red-500 text-red-500" : "text-neutral-700"}
          />
        </button>
      </div>
      <div className="relative space-y-1.5 px-2 pb-2 pt-3">
        {listing.verification_status === "verified" && (
          <span className="absolute bottom-3 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-lime-600">
            <BadgeCheck size={13} className="text-white" />
          </span>
        )}
        <div className="text-lg font-bold leading-7 text-brand-500">{naira(listing.price)}</div>
        <div className="body-md truncate text-neutral-600">{listing.title}</div>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">
            {listing.location_area}, {listing.location_city}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <VerificationBadge status={listing.verification_status} />
          {listing.bedrooms ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              <BedDouble size={12} /> {listing.bedrooms} Bed
            </span>
          ) : null}
          {listing.bathrooms ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              <Bath size={12} /> {listing.bathrooms} Bath
            </span>
          ) : null}
          {listing.land_size_sqm ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              <Ruler size={12} /> {listing.land_size_sqm} sqm
            </span>
          ) : null}
        </div>
        {cartable && (
          <button
            onClick={toggleCart}
            className={`btn-text mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl transition ${
              carted
                ? "bg-lime-100 text-lime-600"
                : "bg-neutral-950 text-white hover:bg-brand-900"
            }`}
          >
            {carted ? <><Check size={15} /> In Cart</> : <><ShoppingBag size={15} /> Add to Cart</>}
          </button>
        )}
      </div>
    </Link>
  );
}
