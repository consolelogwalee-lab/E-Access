"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Plus, Trash2, Wallet, X } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { naira } from "@/lib/format";
import { listingImage } from "@/lib/images";

type Plan = {
  id: number; listing_id: number; total_amount: number | string; amount_paid: number | string;
  next_due_date: string | null; note: string | null; listing_title: string; estate_name: string | null;
  location_area: string; location_city: string; property_type: string; image_seed: number;
};
type Payment = { id: number; installment_id: number; amount: number | string; paid_at: string; note: string | null };
type Pickable = { id: number; title: string; price: number | string };

export default function PaymentsPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [adding, setAdding] = useState(false);
  const [paying, setPaying] = useState<Plan | null>(null);
  const [pickables, setPickables] = useState<Pickable[]>([]);
  const [form, setForm] = useState({ listingId: "", totalAmount: "", nextDueDate: "", note: "" });
  const [payForm, setPayForm] = useState({ amount: "", nextDueDate: "", note: "" });
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    fetch("/api/installments").then((r) => r.json()).then((d) => {
      setPlans(d.plans ?? []);
      setPayments(d.payments ?? []);
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!adding) return;
    fetch("/api/listings?perPage=100").then((r) => r.json()).then((d) => setPickables(d.listings ?? []));
  }, [adding]);

  async function createPlan() {
    setErr("");
    const res = await fetch("/api/installments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: Number(form.listingId),
        totalAmount: Number(form.totalAmount),
        nextDueDate: form.nextDueDate || null,
        note: form.note || null,
      }),
    });
    const d = await res.json();
    if (!res.ok) { setErr(d.error ?? "Could not create the plan."); return; }
    setAdding(false);
    setForm({ listingId: "", totalAmount: "", nextDueDate: "", note: "" });
    load();
  }

  async function recordPayment() {
    if (!paying) return;
    setErr("");
    const res = await fetch(`/api/installments/${paying.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(payForm.amount),
        nextDueDate: payForm.nextDueDate || null,
        note: payForm.note || null,
      }),
    });
    const d = await res.json();
    if (!res.ok) { setErr(d.error ?? "Could not record the payment."); return; }
    setPaying(null);
    setPayForm({ amount: "", nextDueDate: "", note: "" });
    load();
  }

  async function removePlan(id: number) {
    if (!confirm("Remove this payment plan and its history?")) return;
    await fetch(`/api/installments/${id}`, { method: "DELETE" });
    load();
  }

  const input = "mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400";

  return (
    <div>
      <Topbar crumbs={[["Main", "/dashboard"], ["Payment Plans", ""]]} showRegion={false} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h3 text-neutral-900">Payment Plans</h1>
          <p className="body-md mt-1 text-neutral-500">Track instalment payments on properties you are buying.</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-text flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-white transition hover:bg-neutral-800">
          <Plus size={15} /> Track a plan
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {plans === null && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
        {plans?.length === 0 && (
          <div className="flex h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
            <Wallet size={28} className="text-neutral-300" />
            <p className="h4 mt-3 text-neutral-700">No payment plans yet</p>
            <p className="body-md mt-1 max-w-[400px] text-neutral-400">
              Buying a property on instalments? Track every payment and never miss a due date.
            </p>
          </div>
        )}
        {plans?.map((p) => {
          const total = Number(p.total_amount), paid = Number(p.amount_paid);
          const pct = Math.min(100, Math.round((paid / total) * 100));
          const done = paid >= total;
          const history = payments.filter((x) => x.installment_id === p.id);
          const overdue = !done && p.next_due_date && new Date(p.next_due_date) < new Date();
          return (
            <div key={p.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={listingImage(p)} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/property/${p.listing_id}`} className="block truncate text-[15px] font-semibold text-neutral-900 hover:underline">
                    {p.listing_title}
                  </Link>
                  <div className="text-xs text-neutral-400">{p.estate_name ?? `${p.location_area}, ${p.location_city}`}</div>
                  {p.note && <div className="mt-1 text-xs text-neutral-500">{p.note}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {!done && (
                    <button onClick={() => setPaying(p)} className="btn-text h-10 rounded-full bg-[#E2A600] px-4 text-[#3f3005] transition hover:brightness-105">
                      Record payment
                    </button>
                  )}
                  <button onClick={() => removePlan(p.id)} aria-label="Remove plan" className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-neutral-900">{naira(paid)} <span className="font-normal text-neutral-400">of {naira(total)}</span></span>
                  <span className={`font-semibold ${done ? "text-lime-600" : "text-neutral-500"}`}>{done ? "Fully paid" : `${pct}%`}</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${done ? "bg-lime-500" : "bg-gradient-to-r from-[#E2A600] to-[#d9ad45]"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-neutral-400">Remaining: {naira(Math.max(0, total - paid))}</span>
                  {!done && p.next_due_date && (
                    <span className={`flex items-center gap-1.5 font-medium ${overdue ? "text-red-600" : "text-neutral-500"}`}>
                      <CalendarClock size={13} />
                      {overdue ? "Overdue since " : "Next payment due "}
                      {new Date(p.next_due_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>

              {history.length > 0 && (
                <div className="mt-4 border-t border-neutral-100 pt-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Payment history</div>
                  <ul className="mt-2 space-y-1.5">
                    {history.map((h) => (
                      <li key={h.id} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">
                          {new Date(h.paid_at + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          {h.note ? ` • ${h.note}` : ""}
                        </span>
                        <span className="font-semibold text-neutral-900">{naira(Number(h.amount))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(adding || paying) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-[2px]" onClick={() => { setAdding(false); setPaying(null); setErr(""); }}>
          <div className="w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="h4 text-neutral-900">{adding ? "Track a payment plan" : "Record a payment"}</h2>
              <button onClick={() => { setAdding(false); setPaying(null); setErr(""); }} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100" aria-label="Close">
                <X size={17} />
              </button>
            </div>

            {adding ? (
              <>
                <label className="mt-4 block text-xs font-semibold text-neutral-500">Property</label>
                <select value={form.listingId} onChange={(e) => {
                  const l = pickables.find((x) => x.id === Number(e.target.value));
                  setForm({ ...form, listingId: e.target.value, totalAmount: l ? String(l.price) : form.totalAmount });
                }} className={`${input} bg-white`}>
                  <option value="">Select the property you are paying for</option>
                  {pickables.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
                <label className="mt-4 block text-xs font-semibold text-neutral-500">Total agreed amount (₦)</label>
                <input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className={input} placeholder="e.g. 45000000" />
                <label className="mt-4 block text-xs font-semibold text-neutral-500">First payment due (optional)</label>
                <input type="date" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} className={input} />
                <label className="mt-4 block text-xs font-semibold text-neutral-500">Note (optional)</label>
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={input} placeholder="e.g. 6-month plan agreed with developer" />
                {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
                <button onClick={createPlan} className="btn-text mt-5 h-12 w-full rounded-xl bg-neutral-950 text-white hover:bg-neutral-800">Start tracking</button>
              </>
            ) : paying ? (
              <>
                <p className="body-md mt-2 text-neutral-500">
                  {paying.listing_title} • Remaining {naira(Number(paying.total_amount) - Number(paying.amount_paid))}
                </p>
                <label className="mt-4 block text-xs font-semibold text-neutral-500">Amount paid (₦)</label>
                <input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} className={input} placeholder="e.g. 5000000" />
                <label className="mt-4 block text-xs font-semibold text-neutral-500">Next payment due (optional)</label>
                <input type="date" value={payForm.nextDueDate} onChange={(e) => setPayForm({ ...payForm, nextDueDate: e.target.value })} className={input} />
                <label className="mt-4 block text-xs font-semibold text-neutral-500">Note (optional)</label>
                <input value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} className={input} placeholder="e.g. Bank transfer, 3rd instalment" />
                {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
                <button onClick={recordPayment} className="btn-text mt-5 h-12 w-full rounded-xl bg-neutral-950 text-white hover:bg-neutral-800">Record payment</button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
