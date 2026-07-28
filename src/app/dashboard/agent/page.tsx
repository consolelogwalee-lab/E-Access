"use client";
import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Building2, Clock } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";

type Application = {
  id: number; agency_name: string; phone: string; whatsapp: string | null;
  bio: string | null; areas: string | null; rc_number: string | null; status: string;
};

export default function AgentPage() {
  const [app, setApp] = useState<Application | null | undefined>(undefined);
  const [form, setForm] = useState({ agencyName: "", phone: "", whatsapp: "", bio: "", areas: "", rcNumber: "" });
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const load = useCallback(() => {
    fetch("/api/agents?mine=1").then((r) => r.json()).then((d) => {
      setApp(d.application ?? null);
      if (d.application) {
        setForm({
          agencyName: d.application.agency_name ?? "", phone: d.application.phone ?? "",
          whatsapp: d.application.whatsapp ?? "", bio: d.application.bio ?? "",
          areas: d.application.areas ?? "", rcNumber: d.application.rc_number ?? "",
        });
      }
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit() {
    setErr("");
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (!res.ok) { setErr(d.error ?? "Could not submit."); return; }
    setSent(true);
    load();
  }

  const input = "mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400";
  const label = "mt-4 block text-xs font-semibold text-neutral-500";

  return (
    <div>
      <Topbar crumbs={[["Main", "/dashboard"], ["Agent Profile", ""]]} showRegion={false} />

      <div className="mt-6 max-w-[680px]">
        <h1 className="text-[25px] font-extrabold tracking-[-0.02em] text-neutral-900">Become a Verified Agent</h1>
        <p className="body-md mt-1.5 text-neutral-500">
          Realtors, agents and developers with a verified profile get a Verified Agent badge, a public profile in
          the agent directory, and can list properties that buyers trust.
        </p>

        {app?.status === "approved" && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-lime-200 bg-lime-50 p-5">
            <BadgeCheck size={22} className="shrink-0 text-lime-600" />
            <div>
              <div className="text-sm font-semibold text-lime-700">You are a Verified E-Access Agent</div>
              <p className="text-xs text-lime-600">
                {app.agency_name} appears in the public agent directory. Update your details below anytime.
              </p>
            </div>
          </div>
        )}
        {app?.status === "pending" && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <Clock size={20} className="shrink-0 text-amber-600" />
            <div>
              <div className="text-sm font-semibold text-amber-700">Application under review</div>
              <p className="text-xs text-amber-600">The team is verifying your details. You will get a notification once approved.</p>
            </div>
          </div>
        )}
        {app?.status === "rejected" && (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
            Your previous application was not approved. Update your details and resubmit.
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Building2 size={16} className="text-neutral-400" /> {app ? "Your agent details" : "Apply now"}
          </div>
          <label className={label}>Agency / business name</label>
          <input value={form.agencyName} onChange={(e) => setForm({ ...form, agencyName: e.target.value })} className={input} placeholder="e.g. PalmField Realty" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Phone number</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} placeholder="e.g. 0803 000 0000" />
            </div>
            <div>
              <label className={label}>WhatsApp number (recommended)</label>
              <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={input} placeholder="e.g. 2348030000000" />
            </div>
          </div>
          <label className={label}>Areas you cover</label>
          <input value={form.areas} onChange={(e) => setForm({ ...form, areas: e.target.value })} className={input} placeholder="e.g. Lekki, Ajah, Ibeju-Lekki" />
          <label className={label}>RC / CAC number (optional, speeds up verification)</label>
          <input value={form.rcNumber} onChange={(e) => setForm({ ...form, rcNumber: e.target.value })} className={input} placeholder="e.g. RC 1234567" />
          <label className={label}>About you / your agency</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className={input} placeholder="Experience, specialties, notable projects…" />
          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
          {sent && !err && <p className="mt-3 text-sm text-lime-600">Submitted. The team will review it shortly.</p>}
          <button onClick={submit} className="btn-gold mt-5 flex h-12 w-full items-center justify-center rounded-xl text-[14px]">
            {app ? "Update details" : "Submit application"}
          </button>
        </div>
      </div>
    </div>
  );
}
