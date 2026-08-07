"use client";
import { useCallback, useEffect, useState } from "react";
import { FileText, Check, AlertTriangle, X, MapPin, Eye } from "lucide-react";
import { timeAgo, naira } from "@/lib/format";
import { listingImage } from "@/lib/images";

type PendingDoc = {
  id: number; listing_id: number; doc_type: string; file_name: string; status: string; uploaded_at: string;
  listing_title: string; estate_name: string | null; verification_status: string; location_city: string;
  owner_name: string | null;
};
type Listing = {
  id: number; title: string; price: number; property_type: string; location_area: string; location_city: string;
  estate_name: string | null; bedrooms: number | null; bathrooms: number | null; land_size_sqm: number | null;
  description: string | null; verification_status: string; image_seed: number; owner_name: string | null;
};
type Doc = { id: number; doc_type: string; file_name: string; status: string; storage_path: string | null };

const FILTERS: [string, string][] = [
  ["all", "All"], ["under_review", "Under Review"], ["approved", "Approved"], ["action_required", "Needs Action"],
];

export default function AdminVerifications() {
  const [docs, setDocs] = useState<PendingDoc[] | null>(null);
  const [busyId, setBusyId] = useState(0);
  const [filter, setFilter] = useState("all");
  const [preview, setPreview] = useState<{ doc: PendingDoc; listing: Listing; documents: Doc[]; media: { url: string }[] } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/documents").then((r) => r.json()).then((d) => setDocs(d.documents ?? []));
  }, []);
  useEffect(load, [load]);

  async function setStatus(id: number, status: string) {
    setBusyId(id);
    await fetch("/api/admin/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBusyId(0);
    setPreview(null);
    load();
  }

  async function openPreview(doc: PendingDoc) {
    setLoadingPreview(true);
    const d = await fetch(`/api/listings/${doc.listing_id}`).then((r) => r.json()).catch(() => null);
    setLoadingPreview(false);
    if (d?.listing) setPreview({ doc, listing: d.listing, documents: d.documents ?? [], media: d.media ?? [] });
  }

  const shown = (docs ?? []).filter((d) => filter === "all" || d.status === filter);

  return (
    <div>
      <h1 className="h3 text-neutral-900">Verification Queue</h1>
      <p className="body-md text-neutral-400">
        Documents awaiting review. Open a submission to see the property, then approve or flag it.
      </p>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filter === k ? "bg-brand-900 text-white" : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {docs === null ? (
        <div className="mt-5 h-[300px] animate-pulse rounded-2xl bg-white" />
      ) : shown.length === 0 ? (
        <div className="mt-5 flex h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
          <Check size={28} className="text-lime-600" />
          <p className="h4 mt-3 text-neutral-700">Nothing here</p>
          <p className="body-md mt-1 text-neutral-400">No documents match this filter.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {shown.map((d) => (
            <div key={d.id} className={`flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 ${busyId === d.id ? "opacity-50" : ""}`}>
              <button onClick={() => openPreview(d)} className="flex min-w-0 flex-1 items-center gap-4 text-left" disabled={loadingPreview}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                  <FileText size={18} className="text-neutral-500" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900">{d.doc_type}</span>
                  <span className="block truncate text-xs text-neutral-400">
                    {d.estate_name ?? d.listing_title} • {d.location_city} • by {d.owner_name ?? "—"} • {timeAgo(d.uploaded_at)}
                  </span>
                </span>
              </button>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                d.status === "under_review" ? "bg-amber-100 text-amber-700"
                : d.status === "approved" ? "bg-lime-100 text-lime-600"
                : d.status === "action_required" ? "bg-red-100 text-red-600"
                : "bg-neutral-100 text-neutral-500"
              }`}>{d.status.replace("_", " ")}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => openPreview(d)} className="flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 px-3.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400">
                  <Eye size={13} /> View
                </button>
                <button onClick={() => setStatus(d.id, "approved")} className="flex h-9 items-center gap-1.5 rounded-full bg-lime-600 px-4 text-xs font-semibold text-white transition hover:brightness-110">
                  <Check size={13} /> Approve
                </button>
                <button onClick={() => setStatus(d.id, "action_required")} className="flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 px-4 text-xs font-semibold text-neutral-600 transition hover:border-red-300 hover:text-red-600">
                  <AlertTriangle size={13} /> Needs Action
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Property preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-[2px]" onClick={() => setPreview(null)}>
          <div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white shadow-2xl scroll-thin" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.media[0]?.url ?? listingImage(preview.listing)} alt="" className="h-[220px] w-full object-cover" />
              <button onClick={() => setPreview(null)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow" aria-label="Close"><X size={17} /></button>
              <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${preview.listing.verification_status === "verified" ? "bg-lime-500 text-white" : "bg-white/90 text-neutral-700"}`}>
                {preview.listing.verification_status === "verified" ? "Verified" : "Unverified"}
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-neutral-900">{preview.listing.title}</h2>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-neutral-500"><MapPin size={13} /> {preview.listing.location_area}, {preview.listing.location_city}</p>
                </div>
                <div className="shrink-0 text-lg font-bold text-brand-500">{naira(preview.listing.price)}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-neutral-100 px-3 py-1 capitalize text-neutral-600">{preview.listing.property_type}</span>
                {preview.listing.bedrooms ? <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-600">{preview.listing.bedrooms} Bed</span> : null}
                {preview.listing.bathrooms ? <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-600">{preview.listing.bathrooms} Bath</span> : null}
                {preview.listing.land_size_sqm ? <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-600">{preview.listing.land_size_sqm} sqm</span> : null}
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-600">Owner: {preview.listing.owner_name ?? "—"}</span>
              </div>
              {preview.listing.description && <p className="body-md mt-3 text-neutral-600">{preview.listing.description}</p>}

              <h3 className="mt-5 text-sm font-semibold text-neutral-900">Listing documents</h3>
              <ul className="mt-2 space-y-1.5">
                {preview.documents.length === 0 && <li className="text-xs text-neutral-400">No documents on this listing.</li>}
                {preview.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-700">
                    <FileText size={15} className="shrink-0 text-neutral-400" />
                    <span className="min-w-0 flex-1 truncate">{doc.doc_type}: {doc.file_name}</span>
                    {doc.storage_path ? (
                      <a href={`/api/files?path=${encodeURIComponent(doc.storage_path)}`} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg bg-support-blue px-3 py-1.5 text-xs font-semibold text-white">View</a>
                    ) : (
                      <span className="shrink-0 rounded-lg bg-neutral-200 px-2.5 py-1.5 text-[11px] text-neutral-500">Not uploaded</span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex gap-2">
                <button onClick={() => setStatus(preview.doc.id, "approved")} className="btn-text flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-lime-600 text-white transition hover:brightness-110">
                  <Check size={15} /> Approve document
                </button>
                <button onClick={() => setStatus(preview.doc.id, "action_required")} className="btn-text flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 text-neutral-700 transition hover:border-red-300 hover:text-red-600">
                  <AlertTriangle size={15} /> Needs Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
