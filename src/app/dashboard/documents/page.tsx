"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpDown, Copy, Download, FileText, MoreHorizontal, X, BadgeCheck } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { VerificationBadge } from "@/components/Badges";
import { poolImage } from "@/lib/images";

type Doc = {
  id: number; listing_id: number; doc_type: string; file_name: string; status: string; uploaded_at: string;
  listing_title: string; estate_name: string | null; location_area: string; location_city: string; image_seed: number;
};

const STATUS_FOLDERS = [
  { key: "all", label: "All Documents", tab: "blue" },
  { key: "approved", label: "Verified", tab: "green" },
  { key: "under_review", label: "Under Review", tab: "orange" },
  { key: "action_required", label: "Action Required", tab: "red" },
] as const;

const TYPE_ORDER = [
  "Survey Plan", "Allocation Letter", "Certificate of Occupancy",
  "Deed of Assignment", "Building Approval", "Supporting Document",
];

function plural(t: string): string {
  if (t.includes(" of ")) {
    const [head, ...rest] = t.split(" of ");
    return `${plural(head)} of ${rest.join(" of ")}`;
  }
  if (t.endsWith("y")) return t.slice(0, -1) + "ies";
  return t + "s";
}

export default function DocumentsVaultPage() {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [folder, setFolder] = useState<{ kind: "status" | "type"; value: string; label: string } | null>(null);
  const [viewDoc, setViewDoc] = useState<Doc | null>(null);

  useEffect(() => {
    fetch("/api/documents").then((r) => r.json()).then((d) => setDocs(d.documents ?? []));
  }, []);

  const byStatus = useMemo(() => {
    const all = docs ?? [];
    return {
      all,
      approved: all.filter((d) => d.status === "approved"),
      under_review: all.filter((d) => d.status === "under_review" || d.status === "pending"),
      action_required: all.filter((d) => d.status === "action_required"),
    };
  }, [docs]);

  const types = useMemo(() => {
    const all = docs ?? [];
    const map = new Map<string, Doc[]>();
    for (const d of all) {
      const key = TYPE_ORDER.includes(d.doc_type) ? d.doc_type : "Supporting Document";
      map.set(key, [...(map.get(key) ?? []), d]);
    }
    return [...map.entries()].sort((a, b) => TYPE_ORDER.indexOf(a[0]) - TYPE_ORDER.indexOf(b[0]));
  }, [docs]);

  const shown: Doc[] = useMemo(() => {
    if (!folder) return [];
    if (folder.kind === "status") return byStatus[folder.value as keyof typeof byStatus] ?? [];
    return (docs ?? []).filter((d) => (TYPE_ORDER.includes(d.doc_type) ? d.doc_type : "Supporting Document") === folder.value);
  }, [folder, byStatus, docs]);

  return (
    <div>
      <Topbar
        crumbs={folder ? [["Main", "/dashboard"], ["Documents Vault", "#"], [folder.label, ""]] : [["Main", "/dashboard"], ["Documents Vault", ""]]}
        searchPlaceholder="Search documents by name, property and reference number"
        showRegion={false}
      />

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {folder && (
            <button
              onClick={() => setFolder(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
            >
              <ArrowLeft size={15} />
            </button>
          )}
          <h1 className="h3 text-neutral-900">{folder ? folder.label : "Documents Vault"}</h1>
        </div>
        <button className="flex h-[34px] items-center gap-2 rounded-full bg-neutral-950 px-4 text-xs font-semibold text-white">
          <ArrowUpDown size={13} /> All
        </button>
      </div>

      {!folder ? (
        <>
          {/* Status folders */}
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {STATUS_FOLDERS.map((f) => (
              <button key={f.key} onClick={() => setFolder({ kind: "status", value: f.key, label: f.label })} className="group text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/folder-${f.tab}.svg`} alt="" className="w-[120px] transition group-hover:-translate-y-1" />
                <div className="mt-2 text-sm font-medium text-neutral-900">{f.label}</div>
                <div className="text-xs text-neutral-400">({byStatus[f.key as keyof typeof byStatus]?.length ?? 0})</div>
              </button>
            ))}
          </div>

          <h2 className="label-lg mt-10 text-neutral-900">All Document Types</h2>
          <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {types.map(([type, list]) => (
              <button key={type} onClick={() => setFolder({ kind: "type", value: type, label: plural(type) })} className="group text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/folder-tan.svg" alt="" className="w-[120px] transition group-hover:-translate-y-1" />
                <div className="mt-2 text-sm font-medium text-neutral-900">{plural(type)}</div>
                <div className="text-xs text-neutral-400">({list.length})</div>
              </button>
            ))}
            {docs !== null && types.length === 0 && (
              <p className="body-md col-span-full text-neutral-400">No documents yet. They appear here when you add listings.</p>
            )}
          </div>
        </>
      ) : (
        <div className="mt-6 max-w-[720px] space-y-2">
          {shown.length === 0 && <p className="body-md text-neutral-400">This folder is empty.</p>}
          {shown.map((d) => (
            <button
              key={d.id}
              onClick={() => setViewDoc(d)}
              className="flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-400"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100">
                <FileText size={18} className="text-neutral-500" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-neutral-900">{d.doc_type}</span>
                <span className="block truncate text-xs text-neutral-400">
                  {d.estate_name ?? d.listing_title} • {d.file_name}
                </span>
              </span>
              <VerificationBadge status={d.status === "approved" ? "verified" : d.status === "under_review" ? "under_review" : d.status === "action_required" ? "action_required" : "unverified"} />
            </button>
          ))}
        </div>
      )}

      {/* Doc info overlay */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex bg-neutral-950/50 backdrop-blur-[2px]" onClick={() => setViewDoc(null)}>
          {/* Preview */}
          <div className="hidden flex-1 items-center justify-center p-10 lg:flex" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full max-w-[480px]">
              <span className="absolute -top-8 right-0 text-sm text-white/80"><span className="text-2xl font-semibold text-white">1</span>/1</span>
              <div className="max-h-[70vh] overflow-hidden rounded-2xl bg-white p-8 shadow-2xl">
                <h3 className="h4 text-neutral-900">{viewDoc.doc_type}</h3>
                <p className="body-md mt-4 text-neutral-500">
                  This is a simulated preview of <span className="font-medium text-neutral-700">{viewDoc.file_name}</span> for{" "}
                  {viewDoc.estate_name ?? viewDoc.listing_title}, {viewDoc.location_area}, {viewDoc.location_city}. In production this panel renders
                  the uploaded PDF pages for review, with pagination for multi-page documents.
                </p>
                <div className="mt-6 h-40 rounded-xl bg-neutral-100" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                {viewDoc.status === "approved" ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-lime-600">
                    <BadgeCheck size={14} /> Verified
                  </span>
                ) : <span />}
                <span className="flex items-center gap-2 rounded-full bg-white px-2 py-1.5 pr-3 text-xs font-medium text-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={poolImage(viewDoc.image_seed)} alt="" className="h-6 w-6 rounded-full object-cover" />
                  {(viewDoc.estate_name ?? viewDoc.listing_title).slice(0, 18)}…
                </span>
              </div>
            </div>
          </div>
          {/* Details panel */}
          <div className="ml-auto flex h-full w-full max-w-[426px] flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 pt-6">
              <h2 className="text-xl font-semibold text-neutral-900">
                {(viewDoc.estate_name ?? "Property").split(" ")[0]} {viewDoc.doc_type.toLowerCase()} document
              </h2>
              <button onClick={() => setViewDoc(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100">
                <X size={18} />
              </button>
            </div>
            <div className="mt-2 flex gap-5 border-b border-neutral-100 px-6 text-sm">
              <span className="border-b-2 border-neutral-900 pb-2 font-medium text-neutral-900">Details</span>
              <span className="pb-2 text-neutral-400">Verification History</span>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 scroll-thin">
              <div>
                <div className="caption text-neutral-400">Reference Number</div>
                <div className="mt-1.5 flex items-center justify-between rounded-xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-800">
                  SP/LS/2026/{String(viewDoc.id).padStart(5, "0")}
                  <Copy size={15} className="text-neutral-400" />
                </div>
              </div>
              {[
                ["Upload Date", new Date(viewDoc.uploaded_at + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
                ["Document Type", viewDoc.doc_type],
                ["Status", viewDoc.status === "approved" ? "Reviewed and approved" : viewDoc.status === "under_review" ? "Under review by the verification team" : viewDoc.status === "action_required" ? "Action required, see notes" : "Pending review"],
                ["Uploaded By", "You"],
                ["File Size", "2.8 MB • PDF Document"],
                ["Verification Authority", "E-Access Verification Team"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="caption text-neutral-400">{k}</div>
                  <div className="mt-1 text-sm font-medium text-neutral-800">{v}</div>
                </div>
              ))}
              <div>
                <div className="caption text-neutral-400">Document ID</div>
                <div className="mt-1.5 flex items-center justify-between rounded-xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-800">
                  DOC-2026-{String(viewDoc.id).padStart(5, "0")}
                  <Copy size={15} className="text-neutral-400" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-neutral-100 px-6 py-4">
              <button className="btn-text h-12 flex-1 rounded-xl bg-neutral-100 text-neutral-800 transition hover:bg-neutral-200">
                <span className="inline-flex items-center gap-2"><Download size={15} /> Download</span>
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
                <MoreHorizontal size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
