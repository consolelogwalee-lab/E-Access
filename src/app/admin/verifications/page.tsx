"use client";
import { useCallback, useEffect, useState } from "react";
import { FileText, Check, AlertTriangle } from "lucide-react";
import { timeAgo } from "@/lib/format";

type PendingDoc = {
  id: number; listing_id: number; doc_type: string; file_name: string; status: string; uploaded_at: string;
  listing_title: string; estate_name: string | null; verification_status: string; location_city: string;
  owner_name: string | null;
};

export default function AdminVerifications() {
  const [docs, setDocs] = useState<PendingDoc[] | null>(null);
  const [busyId, setBusyId] = useState(0);

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
    load();
  }

  return (
    <div>
      <h1 className="h3 text-neutral-900">Verification Queue</h1>
      <p className="body-md text-neutral-400">
        Documents awaiting review. Approving every document on a listing verifies it automatically;
        flagging one puts the listing into &ldquo;Action Required&rdquo;.
      </p>

      {docs === null ? (
        <div className="mt-6 h-[300px] animate-pulse rounded-2xl bg-white" />
      ) : docs.length === 0 ? (
        <div className="mt-6 flex h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
          <Check size={28} className="text-lime-600" />
          <p className="h4 mt-3 text-neutral-700">Queue is clear</p>
          <p className="body-md mt-1 text-neutral-400">New document submissions land here for review.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {docs.map((d) => (
            <div key={d.id} className={`flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 ${busyId === d.id ? "opacity-50" : ""}`}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100">
                <FileText size={18} className="text-neutral-500" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-neutral-900">{d.doc_type}</div>
                <div className="truncate text-xs text-neutral-400">
                  {d.estate_name ?? d.listing_title} • {d.location_city} • by {d.owner_name ?? "—"} • {timeAgo(d.uploaded_at)}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                d.status === "under_review" ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-500"
              }`}>{d.status.replace("_", " ")}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatus(d.id, "approved")}
                  className="flex h-9 items-center gap-1.5 rounded-full bg-lime-600 px-4 text-xs font-semibold text-white transition hover:brightness-110"
                >
                  <Check size={13} /> Approve
                </button>
                <button
                  onClick={() => setStatus(d.id, "action_required")}
                  className="flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 px-4 text-xs font-semibold text-neutral-600 transition hover:border-red-300 hover:text-red-600"
                >
                  <AlertTriangle size={13} /> Needs Action
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
