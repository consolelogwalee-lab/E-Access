"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Star, ExternalLink } from "lucide-react";
import { naira, TYPE_LABEL } from "@/lib/format";

type AdminListing = {
  id: number; title: string; property_type: string; price: number; location_city: string;
  verification_status: string; status: string; featured: number; views: number; saves: number;
  owner_name: string | null; owner_email: string | null; image_seed: number;
};

const VSTATUSES = ["verified", "under_review", "unverified", "action_required"];

function AdminListingsInner() {
  const sp = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(sp.get("filter") ?? "");
  const [listings, setListings] = useState<AdminListing[] | null>(null);
  const [busyId, setBusyId] = useState(0);

  const load = useCallback(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (filter) p.set("filter", filter);
    fetch(`/api/admin/listings?${p}`).then((r) => r.json()).then((d) => setListings(d.listings ?? []));
  }, [search, filter]);
  useEffect(load, [load]);

  async function patch(id: number, body: Record<string, unknown>) {
    setBusyId(id);
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    setBusyId(0);
    load();
  }

  return (
    <div>
      <h1 className="h3 text-neutral-900">Listings</h1>
      <p className="body-md text-neutral-400">Approve, feature, or archive any listing on the platform.</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, city, estate…"
            className="h-10 w-[280px] rounded-full border border-neutral-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 rounded-full border border-neutral-200 bg-white px-4 text-sm outline-none"
        >
          <option value="">All verification states</option>
          {VSTATUSES.map((v) => <option key={v} value={v}>{v.replace("_", " ")}</option>)}
        </select>
        <span className="text-xs text-neutral-400">{listings?.length ?? "…"} listings</span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs text-neutral-400">
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stats</th>
              <th className="px-4 py-3 font-medium">Verification</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Featured</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {(listings ?? []).map((l) => (
              <tr key={l.id} className={busyId === l.id ? "opacity-50" : ""}>
                <td className="max-w-[260px] px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/property-${l.image_seed}.svg`} alt="" className="h-9 w-12 shrink-0 rounded-md object-cover" />
                    <div className="min-w-0">
                      <Link href={`/dashboard/property/${l.id}`} target="_blank" className="flex items-center gap-1 truncate font-medium text-neutral-800 hover:underline">
                        <span className="truncate">{l.title}</span> <ExternalLink size={11} className="shrink-0 text-neutral-300" />
                      </Link>
                      <div className="text-xs text-neutral-400">{TYPE_LABEL[l.property_type]} • {l.location_city}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-neutral-700">{l.owner_name ?? "—"}</div>
                  <div className="text-xs text-neutral-400">{l.owner_email ?? ""}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-800">{naira(l.price)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">{l.views} views • {l.saves} saves</td>
                <td className="px-4 py-3">
                  <select
                    value={l.verification_status}
                    onChange={(e) => patch(l.id, { verificationStatus: e.target.value })}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-medium outline-none ${
                      l.verification_status === "verified" ? "border-lime-600/30 bg-lime-50 text-lime-600"
                      : l.verification_status === "under_review" ? "border-amber-300 bg-amber-50 text-amber-700"
                      : l.verification_status === "action_required" ? "border-red-300 bg-red-50 text-red-700"
                      : "border-neutral-200 bg-neutral-50 text-neutral-500"
                    }`}
                  >
                    {VSTATUSES.map((v) => <option key={v} value={v}>{v.replace("_", " ")}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={l.status}
                    onChange={(e) => patch(l.id, { status: e.target.value })}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs font-medium text-neutral-600 outline-none"
                  >
                    {["active", "draft", "sold", "archived"].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => patch(l.id, { featured: !l.featured })}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                      l.featured ? "bg-amber-100 text-amber-500" : "bg-neutral-100 text-neutral-300 hover:text-neutral-500"
                    }`}
                    title={l.featured ? "Unfeature" : "Feature on landing page"}
                  >
                    <Star size={15} className={l.featured ? "fill-amber-400" : ""} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {listings?.length === 0 && <p className="body-md p-6 text-center text-neutral-400">No listings match.</p>}
      </div>
    </div>
  );
}

export default function AdminListings() {
  return <Suspense><AdminListingsInner /></Suspense>;
}
