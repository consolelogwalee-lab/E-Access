"use client";
import { useCallback, useEffect, useState } from "react";
import { Camera, FileText, ShieldCheck, X } from "lucide-react";

type Req = {
  id: number; reference: string; property_title: string; property_type: string;
  address: string; city: string; state: string; title_type: string | null; notes: string | null;
  status: string; admin_note: string | null; created_at: string;
  owner_name: string; owner_email: string; doc_count: number | string; photo_count: number | string;
};
type File_ = { id: number; kind: string; doc_type: string | null; file_name: string; storage_path: string | null };
type Event_ = { id: number; status: string; note: string | null; actor: string; created_at: string };

const STATUS_META: Record<string, { label: string; cls: string }> = {
  submitted: { label: "New", cls: "bg-blue-50 text-blue-700" },
  in_review: { label: "In Review", cls: "bg-amber-50 text-amber-700" },
  legal_review: { label: "With Legal", cls: "bg-purple-50 text-purple-700" },
  action_required: { label: "Awaiting Client", cls: "bg-red-50 text-red-600" },
  approved: { label: "Approved & Stamped", cls: "bg-lime-50 text-lime-700" },
  rejected: { label: "Rejected", cls: "bg-neutral-100 text-neutral-500" },
};

const ACTIONS: { status: string; label: string; cls: string; needsNote?: boolean }[] = [
  { status: "in_review", label: "Start review", cls: "bg-amber-500 text-white hover:bg-amber-600" },
  { status: "legal_review", label: "Send to legal team", cls: "bg-purple-600 text-white hover:bg-purple-700" },
  { status: "action_required", label: "Request changes", cls: "bg-red-500 text-white hover:bg-red-600", needsNote: true },
  { status: "approved", label: "Approve & stamp", cls: "bg-lime-600 text-white hover:bg-lime-700" },
  { status: "rejected", label: "Reject", cls: "bg-neutral-200 text-neutral-700 hover:bg-neutral-300", needsNote: true },
];

export default function AdminValidationsPage() {
  const [requests, setRequests] = useState<Req[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<{ files: File_[]; events: Event_[] } | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/validations").then((r) => r.json()).then((d) => setRequests(d.requests ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (openId === null) { setDetail(null); setNote(""); setErr(""); return; }
    fetch(`/api/validations/${openId}`).then((r) => r.json()).then((d) => setDetail({ files: d.files ?? [], events: d.events ?? [] }));
  }, [openId]);

  const open = requests?.find((r) => r.id === openId) ?? null;

  async function act(status: string, needsNote?: boolean) {
    if (needsNote && !note.trim()) { setErr("Add a note for the client first (what needs to change / why)."); return; }
    setBusy(true); setErr("");
    const res = await fetch("/api/admin/validations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: openId, status, note: note.trim() || null }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(d.error ?? "Update failed."); return; }
    setNote("");
    load();
    fetch(`/api/validations/${openId}`).then((r) => r.json()).then((dd) => setDetail({ files: dd.files ?? [], events: dd.events ?? [] }));
  }

  return (
    <div>
      <h1 className="h3 text-neutral-900">Property Validations</h1>
      <p className="body-md mt-1 text-neutral-500">
        Client-submitted properties awaiting verification. Move each request through review, legal checks, and stamping. Every action notifies the client.
      </p>

      <div className="mt-6 space-y-2">
        {requests === null && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
        {requests?.length === 0 && (
          <div className="flex h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60">
            <ShieldCheck size={28} className="text-neutral-300" />
            <p className="body-md mt-3 text-neutral-400">No validation requests yet.</p>
          </div>
        )}
        {requests?.map((r) => {
          const meta = STATUS_META[r.status] ?? STATUS_META.submitted;
          return (
            <button key={r.id} onClick={() => setOpenId(r.id)} className="flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-400">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-neutral-900">{r.property_title}</span>
                <span className="block truncate text-xs text-neutral-400">
                  {r.reference} • {r.city}, {r.state} • {r.owner_name} • {r.doc_count} docs, {r.photo_count} photos
                </span>
              </span>
              <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex bg-neutral-950/50 backdrop-blur-[2px]" onClick={() => setOpenId(null)}>
          <div className="ml-auto flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-neutral-100 p-6">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-neutral-900">{open.property_title}</h2>
                <p className="text-xs text-neutral-400">{open.reference} • {open.owner_name} ({open.owner_email})</p>
              </div>
              <button onClick={() => setOpenId(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100" aria-label="Close"><X size={17} /></button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6 scroll-thin">
              <div className="rounded-xl bg-neutral-50 p-4 text-sm">
                <div className="grid grid-cols-2 gap-2 text-neutral-700">
                  <span className="text-neutral-400">Type</span><span className="capitalize">{open.property_type}</span>
                  <span className="text-neutral-400">Address</span><span>{open.address}, {open.city}, {open.state}</span>
                  <span className="text-neutral-400">Title held</span><span>{open.title_type ?? "Not stated"}</span>
                </div>
                {open.notes && <p className="mt-3 border-t border-neutral-200 pt-3 text-xs text-neutral-500">Client note: {open.notes}</p>}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Files</h3>
                <ul className="mt-2 space-y-1.5">
                  {detail?.files.map((f) => (
                    <li key={f.id} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-700">
                      {f.kind === "photo" ? <Camera size={15} className="shrink-0 text-neutral-400" /> : <FileText size={15} className="shrink-0 text-neutral-400" />}
                      <span className="min-w-0 flex-1 truncate">{f.doc_type ? `${f.doc_type}: ` : ""}{f.file_name}</span>
                      {f.storage_path && (
                        <a href={`/api/files?path=${encodeURIComponent(f.storage_path)}`} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-support-blue hover:underline">Open</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-neutral-900">History</h3>
                <ul className="mt-2 space-y-2">
                  {detail?.events.map((e) => (
                    <li key={e.id} className="text-xs text-neutral-500">
                      <span className="font-semibold text-neutral-700">{STATUS_META[e.status]?.label ?? e.status}</span>
                      {e.note ? ` — ${e.note}` : ""} · {new Date(e.created_at + "Z").toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {!["approved", "rejected"].includes(open.status) && (
              <div className="border-t border-neutral-100 p-5">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Note to the client (required when requesting changes or rejecting)"
                  className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-400"
                />
                {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {ACTIONS.filter((a) => a.status !== open.status).map((a) => (
                    <button
                      key={a.status}
                      disabled={busy}
                      onClick={() => act(a.status, a.needsNote)}
                      className={`btn-text h-10 rounded-full px-4 transition disabled:opacity-50 ${a.cls}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
