"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, FileText, Printer, ShieldCheck } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { LogoMark } from "@/components/Logo";

type Req = {
  id: number; reference: string; property_title: string; property_type: string;
  address: string; city: string; state: string; title_type: string | null; notes: string | null;
  status: string; admin_note: string | null; stamped_at: string | null; created_at: string;
};
type File_ = { id: number; kind: string; doc_type: string | null; file_name: string };
type Event_ = { id: number; status: string; note: string | null; actor: string; created_at: string };

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  submitted: { label: "Submitted", cls: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  in_review: { label: "Under Review", cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  legal_review: { label: "With Legal Team", cls: "bg-purple-50 text-purple-700", dot: "bg-purple-500" },
  action_required: { label: "Action Required", cls: "bg-red-50 text-red-600", dot: "bg-red-500" },
  approved: { label: "Approved & Stamped", cls: "bg-lime-50 text-lime-700", dot: "bg-lime-500" },
  rejected: { label: "Not Approved", cls: "bg-neutral-100 text-neutral-500", dot: "bg-neutral-400" },
};

export default function ValidationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ request: Req; files: File_[]; events: Event_[] } | null>(null);

  const load = useCallback(() => {
    fetch(`/api/validations/${id}`).then((r) => r.json()).then((d) => { if (d.request) setData(d); });
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (!data) {
    return (
      <div>
        <Topbar />
        <div className="mt-6 h-[360px] animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }
  const R = data.request;
  const meta = STATUS_META[R.status] ?? STATUS_META.submitted;
  const docs = data.files.filter((f) => f.kind === "document");
  const photos = data.files.filter((f) => f.kind === "photo");

  return (
    <div>
      <Topbar crumbs={[["Main", "/dashboard"], ["Verify Property", "/dashboard/validate"], [R.reference, ""]]} showRegion={false} />

      <div className="mt-5 flex items-center gap-3">
        <Link href="/dashboard/validate" className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50">
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="h3 text-neutral-900">{R.property_title}</h1>
          <p className="text-xs text-neutral-400">{R.reference} • {R.address}, {R.city}, {R.state}</p>
        </div>
        <span className={`ml-auto rounded-full px-3.5 py-2 text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
      </div>

      {R.status === "action_required" && R.admin_note && (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5">
          <div className="text-sm font-semibold text-red-700">The team needs something from you</div>
          <p className="body-md mt-1 text-red-600">{R.admin_note}</p>
          <p className="mt-2 text-xs text-red-400">Reply through Messages or submit a new request with the corrected documents.</p>
        </div>
      )}

      {R.status === "approved" && (
        <div className="relative mt-6 overflow-hidden rounded-2xl border-2 border-[#E2A600]/40 bg-white p-8 print:border-black">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#E2A600]/10" />
          <div className="flex flex-wrap items-center gap-6">
            <LogoMark size={64} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E2A600]">Certificate of Verification</div>
              <h2 className="display mt-1 text-[24px] text-neutral-950">This property has been verified and stamped</h2>
              <p className="body-md mt-1 text-neutral-500">
                {R.property_title} at {R.address}, {R.city}, {R.state} passed document, title and registry checks
                conducted by the E-Access verification team and its legal partners.
              </p>
            </div>
            <div className="shrink-0 rotate-[-8deg] rounded-xl border-4 border-[#E2A600] px-5 py-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E2A600]">E-Access</div>
              <div className="text-sm font-extrabold uppercase tracking-widest text-[#1B1F4E]">Verified</div>
              <div className="text-[10px] font-semibold text-neutral-500">
                {R.stamped_at ? new Date(R.stamped_at + "Z").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4 text-xs text-neutral-400">
            <span>Reference: <span className="font-semibold text-neutral-700">{R.reference}</span></span>
            <span>Issued by the E-Access Verification Team for T-Prime Development</span>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3.5 py-2 font-medium text-neutral-600 transition hover:bg-neutral-50 print:hidden">
              <Printer size={13} /> Print / Save PDF
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Timeline */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Progress</h2>
          <ol className="mt-5 space-y-0">
            {data.events.map((e, i) => {
              const em = STATUS_META[e.status] ?? STATUS_META.submitted;
              const last = i === data.events.length - 1;
              return (
                <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {!last && <span className="absolute left-[7px] top-5 h-full w-px bg-neutral-200" />}
                  <span className={`mt-1 h-[15px] w-[15px] shrink-0 rounded-full ring-4 ring-white ${em.dot}`} />
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{em.label}</div>
                    {e.note && <p className="body-md mt-0.5 text-neutral-500">{e.note}</p>}
                    <div className="mt-1 text-xs text-neutral-400">
                      {new Date(e.created_at + "Z").toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {e.actor === "you" ? " • you" : " • E-Access team"}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Files + facts */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-neutral-900">Submitted documents ({docs.length})</h3>
            <ul className="mt-3 space-y-1.5">
              {docs.map((f) => (
                <li key={f.id} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-700">
                  <FileText size={15} className="shrink-0 text-neutral-400" />
                  <span className="min-w-0 truncate"><span className="font-medium">{f.doc_type}:</span> {f.file_name}</span>
                </li>
              ))}
            </ul>
            {photos.length > 0 && (
              <>
                <h3 className="mt-4 text-sm font-semibold text-neutral-900">Photos ({photos.length})</h3>
                <ul className="mt-2 space-y-1.5">
                  {photos.map((f) => (
                    <li key={f.id} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-700">
                      <Camera size={15} className="shrink-0 text-neutral-400" />
                      <span className="min-w-0 truncate">{f.file_name}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-neutral-900">Details</h3>
            <dl className="mt-3 space-y-2.5 text-sm">
              {[
                ["Property type", R.property_type],
                ["Title held", R.title_type ?? "Not stated"],
                ["Submitted", new Date(R.created_at + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-neutral-400">{k}</dt>
                  <dd className="text-right font-medium capitalize text-neutral-800">{v}</dd>
                </div>
              ))}
            </dl>
            {R.notes && <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500">Your note: {R.notes}</p>}
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-[#04040a] p-5 text-white">
            <ShieldCheck size={20} className="shrink-0 text-[#E2A600]" />
            <p className="text-xs text-white/60">
              Never make final payments on any property until its documents have been verified. That is exactly what this service is for.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
