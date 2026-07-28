"use client";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { naira } from "@/lib/format";

type Req = {
  id: number; property_type: string; purpose: string; budget_min: number | string | null;
  budget_max: number | string | null; locations: string; details: string | null; whatsapp: string | null;
  status: string; admin_note: string | null; created_at: string; full_name: string; email: string;
};

const ACTIONS = [
  ["in_progress", "Mark searching", "bg-amber-500 text-white hover:bg-amber-600"],
  ["matched", "Matches found", "bg-lime-600 text-white hover:bg-lime-700"],
  ["closed", "Close", "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"],
] as const;

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Req[] | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch("/api/requests").then((r) => r.json()).then((d) => setRequests(d.requests ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(id: number, status: string) {
    setBusy(id);
    await fetch("/api/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, note: notes[id] || null }),
    });
    setBusy(null);
    load();
  }

  return (
    <div>
      <h1 className="h3 text-neutral-900">Property Requests</h1>
      <p className="body-md mt-1 text-neutral-500">Concierge requests from buyers. Update the status and add a note, the client is notified each time.</p>

      <div className="mt-6 space-y-2">
        {requests === null && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
        {requests?.length === 0 && (
          <div className="flex h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60">
            <Search size={26} className="text-neutral-300" />
            <p className="body-md mt-3 text-neutral-400">No requests yet.</p>
          </div>
        )}
        {requests?.map((r) => (
          <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold capitalize text-neutral-900">
                {r.property_type} to {r.purpose} in {r.locations}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                r.status === "new" ? "bg-blue-50 text-blue-700" :
                r.status === "in_progress" ? "bg-amber-50 text-amber-700" :
                r.status === "matched" ? "bg-lime-50 text-lime-700" : "bg-neutral-100 text-neutral-500"
              }`}>{r.status.replace("_", " ")}</span>
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              {r.full_name} ({r.email}){r.whatsapp ? ` • WA: ${r.whatsapp}` : ""} • Budget: {r.budget_min ? naira(Number(r.budget_min)) : "any"} – {r.budget_max ? naira(Number(r.budget_max)) : "any"}
            </div>
            {r.details && <p className="body-md mt-2 max-w-[640px] text-neutral-600">{r.details}</p>}
            {!["closed"].includes(r.status) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={notes[r.id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                  placeholder="Note to the client (optional)"
                  className="h-10 min-w-[220px] flex-1 rounded-xl border border-neutral-200 px-3.5 text-sm outline-none focus:border-neutral-400"
                />
                {ACTIONS.filter(([s]) => s !== r.status).map(([s, labelText, cls]) => (
                  <button key={s} disabled={busy === r.id} onClick={() => act(r.id, s)}
                    className={`btn-text h-10 rounded-full px-4 transition disabled:opacity-50 ${cls}`}>
                    {labelText}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
