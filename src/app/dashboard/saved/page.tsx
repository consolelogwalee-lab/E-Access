"use client";
import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { ListingCard, type Listing } from "@/components/ListingCard";

export default function SavedPage() {
  const [listings, setListings] = useState<Listing[] | null>(null);

  useEffect(() => {
    fetch("/api/listings?saved=1&perPage=24")
      .then((r) => r.json())
      .then((d) => setListings((d.listings ?? []).map((l: Listing) => ({ ...l, saved: 1 }))));
  }, []);

  return (
    <div>
      <Topbar />
      <h1 className="h3 mt-6 text-neutral-900">Saved Listings</h1>
      {listings === null ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-[350px] animate-pulse rounded-2xl bg-white" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-6 flex h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
          <p className="h4 text-neutral-700">Nothing saved yet</p>
          <p className="body-md mt-1 text-neutral-400">Tap the heart on any listing to keep it here.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
