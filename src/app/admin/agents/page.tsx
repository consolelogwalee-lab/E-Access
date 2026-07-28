"use client";
import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Check, UserRound, X } from "lucide-react";

type Agent = {
  id: number; user_id: number; agency_name: string; phone: string; whatsapp: string | null;
  bio: string | null; areas: string | null; rc_number: string | null; status: string; created_at: string;
  full_name: string; email: string; avatar_color: string;
};

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch("/api/agents?all=1").then((r) => r.json()).then((d) => setAgents(d.agents ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function resolve(id: number, status: "approved" | "rejected") {
    setBusy(id);
    await fetch("/api/agents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBusy(null);
    load();
  }

  return (
    <div>
      <h1 className="h3 text-neutral-900">Agent Applications</h1>
      <p className="body-md mt-1 text-neutral-500">
        Verify realtors, agents and developers. Approved agents get the badge, a public profile, and appear in the directory.
      </p>

      <div className="mt-6 space-y-2">
        {agents === null && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
        {agents?.length === 0 && (
          <div className="flex h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60">
            <UserRound size={26} className="text-neutral-300" />
            <p className="body-md mt-3 text-neutral-400">No applications yet.</p>
          </div>
        )}
        {agents?.map((a) => (
          <div key={a.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: a.avatar_color }}>
                {a.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900">{a.agency_name}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                    a.status === "pending" ? "bg-amber-50 text-amber-700" :
                    a.status === "approved" ? "bg-lime-50 text-lime-700" : "bg-neutral-100 text-neutral-500"
                  }`}>{a.status}</span>
                </div>
                <div className="text-xs text-neutral-400">
                  {a.full_name} ({a.email}) • {a.phone}
                  {a.whatsapp ? ` • WA: ${a.whatsapp}` : ""}
                  {a.rc_number ? ` • ${a.rc_number}` : ""}
                </div>
                {a.areas && <div className="mt-1 text-xs text-neutral-500">Covers: {a.areas}</div>}
                {a.bio && <p className="body-md mt-2 max-w-[560px] text-neutral-600">{a.bio}</p>}
              </div>
              {a.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => resolve(a.id, "approved")} disabled={busy === a.id}
                    className="btn-text flex h-10 items-center gap-1.5 rounded-full bg-lime-600 px-4 text-white transition hover:bg-lime-700 disabled:opacity-50">
                    <Check size={14} /> Approve
                  </button>
                  <button onClick={() => resolve(a.id, "rejected")} disabled={busy === a.id}
                    className="btn-text flex h-10 items-center gap-1.5 rounded-full bg-neutral-100 px-4 text-neutral-700 transition hover:bg-neutral-200 disabled:opacity-50">
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
              {a.status === "approved" && <BadgeCheck size={20} className="shrink-0 text-lime-600" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
