"use client";
import { useCallback, useEffect, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { naira } from "@/lib/format";

type Req = {
  id: number; property_type: string; purpose: string; budget_min: number | string | null;
  budget_max: number | string | null; locations: string; details: string | null;
  status: string; admin_note: string | null; created_at: string;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  new: { label: "Received", cls: "bg-blue-50 text-blue-700" },
  in_progress: { label: "Searching", cls: "bg-amber-50 text-amber-700" },
  matched: { label: "Matches Found", cls: "bg-lime-50 text-lime-700" },
  closed: { label: "Closed", cls: "bg-neutral-100 text-neutral-500" },
};

export default function RequestPage() {
  const [requests, setRequests] = useState<Req[] | null>(null);
  const [form, setForm] = useState({ propertyType: "land", purpose: "buy", budgetMin: "", budgetMax: "", locations: "", details: "", whatsapp: "" });
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const load = useCallback(() => {
    fetch("/api/requests").then((r) => r.json()).then((d) => setRequests(d.requests ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit() {
    setErr("");
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (!res.ok) { setErr(d.error ?? "Could not submit."); return; }
    setSent(true);
    setForm({ propertyType: "land", purpose: "buy", budgetMin: "", budgetMax: "", locations: "", details: "", whatsapp: "" });
    load();
    setTimeout(() => setSent(false), 4000);
  }

  const input = "mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400";
  const label = "mt-4 block text-xs font-semibold text-neutral-500";

  return (
    <div>
      <Topbar crumbs={[["Main", "/dashboard"], ["Request a Property", ""]]} showRegion={false} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          <h1 className="text-[25px] font-extrabold tracking-[-0.02em] text-neutral-900">Tell us what you want. We find it.</h1>
          <p className="body-md mt-1.5 max-w-[520px] text-neutral-500">
            Can&apos;t find the right property? Describe it and the E-Access team, with our network of verified
            agents and developers, will hunt it down and bring you verified options.
          </p>

          <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-500">I want to</label>
                <select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={`${input} bg-white`}>
                  <option value="buy">Buy</option><option value="rent">Rent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500">Property type</label>
                <select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} className={`${input} bg-white`}>
                  <option value="land">Land</option><option value="apartment">Apartment</option>
                  <option value="duplex">Duplex / House</option><option value="commercial">Commercial</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Budget from (₦, optional)</label>
                <input type="number" value={form.budgetMin} onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} className={input} placeholder="e.g. 10000000" />
              </div>
              <div>
                <label className={label}>Budget up to (₦, optional)</label>
                <input type="number" value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} className={input} placeholder="e.g. 50000000" />
              </div>
            </div>
            <label className={label}>Preferred locations</label>
            <input value={form.locations} onChange={(e) => setForm({ ...form, locations: e.target.value })} className={input} placeholder="e.g. Lekki Phase 1, Ikate, Ajah" />
            <label className={label}>Anything else we should know?</label>
            <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} rows={3} className={input} placeholder="e.g. Must be in a gated estate, C of O only, close to the expressway…" />
            <label className={label}>WhatsApp number (so we can reach you fast, optional)</label>
            <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={input} placeholder="e.g. 2348030000000" />
            {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
            {sent && <p className="mt-3 text-sm text-lime-600">Request sent. The team is on it.</p>}
            <button onClick={submit} className="btn-gold mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px]">
              <Sparkles size={15} /> Send my request
            </button>
          </div>
        </div>

        <div>
          <h2 className="label-lg text-neutral-900">Your requests</h2>
          <div className="mt-3 space-y-2">
            {requests === null && <div className="h-28 animate-pulse rounded-2xl bg-white" />}
            {requests?.length === 0 && (
              <div className="flex h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60">
                <Search size={20} className="text-neutral-300" />
                <p className="body-md mt-2 text-neutral-400">No requests yet.</p>
              </div>
            )}
            {requests?.map((r) => {
              const meta = STATUS_META[r.status] ?? STATUS_META.new;
              return (
                <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold capitalize text-neutral-900">
                      {r.property_type} to {r.purpose} · {r.locations}
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.cls}`}>{meta.label}</span>
                  </div>
                  {(r.budget_min || r.budget_max) && (
                    <div className="mt-1 text-xs text-neutral-400">
                      Budget: {r.budget_min ? naira(Number(r.budget_min)) : "any"} – {r.budget_max ? naira(Number(r.budget_max)) : "any"}
                    </div>
                  )}
                  {r.admin_note && <p className="mt-2 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">Team: {r.admin_note}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
