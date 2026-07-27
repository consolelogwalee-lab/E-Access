"use client";
import { use, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, BadgeCheck, Clock3, Eye, Heart, MessageSquare, CalendarCheck2,
  FileText, X, Check, CalendarClock, Archive,
} from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { VerificationBadge } from "@/components/Badges";
import { naira, TYPE_LABEL, timeAgo } from "@/lib/format";
import type { Listing } from "@/components/ListingCard";

type Full = Listing & {
  views: number; saves: number; status: string; description: string | null;
  amenities_json: string | null; toilets: number | null; estate_name: string | null; created_at: string;
};
type Doc = { id: number; doc_type: string; file_name: string; status: string; uploaded_at: string };
type Insp = { id: number; mode: string; date: string; time: string; notes: string | null; status: string; requester_name: string };
type Inq = { id: number; message: string; status: string; created_at: string; sender_name: string };

const TABS = [
  "Overview", "Status & Verification", "Listing Performance", "Listing Info",
  "Uploaded Media", "Listing Documents", "Inspection Requests", "Inquiries",
];

export default function PortfolioListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sp = useSearchParams();
  const [tab, setTab] = useState(() => sp.get("tab") ?? "Overview");
  const [data, setData] = useState<{ listing: Full; documents: Doc[] } | null>(null);
  const [inspections, setInspections] = useState<Insp[]>([]);
  const [inquiries, setInquiries] = useState<Inq[]>([]);
  const [edit, setEdit] = useState(() => sp.get("edit") === "1");
  const [confirmModal, setConfirmModal] = useState<{ insp: Insp; action: "confirmed" | "cancelled" } | null>(null);
  const [reschedule, setReschedule] = useState<Insp | null>(null);
  const [rsDate, setRsDate] = useState("");
  const [rsTime, setRsTime] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [viewInq, setViewInq] = useState<Inq | null>(null);

  // edit form state
  const [eTitle, setETitle] = useState("");
  const [ePrice, setEPrice] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eSaving, setESaving] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/listings/${id}`).then((r) => r.json()).then((d) => {
      setData(d);
      if (d.listing) {
        setETitle(d.listing.title);
        setEPrice(String(d.listing.price));
        setEDesc(d.listing.description ?? "");
      }
    });
    fetch(`/api/inspections?owner=1&listingId=${id}`).then((r) => r.json()).then((d) => setInspections(d.inspections ?? []));
    fetch(`/api/inquiries?listingId=${id}`).then((r) => r.json()).then((d) => setInquiries(d.inquiries ?? []));
  }, [id]);
  useEffect(load, [load]);

  if (!data?.listing) {
    return (
      <div>
        <Topbar />
        <div className="mt-6 h-[420px] animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }
  const L = data.listing;
  const amenities: string[] = L.amenities_json ? JSON.parse(L.amenities_json) : [];

  async function saveEdit() {
    setESaving(true);
    await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: eTitle, price: Number(ePrice), description: eDesc }),
    });
    setESaving(false);
    setEdit(false);
    load();
  }

  async function archive() {
    await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: L.status === "archived" ? "active" : "archived" }),
    });
    load();
  }

  async function setInspStatus(inspId: number, status: string, date?: string, time?: string) {
    await fetch("/api/inspections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inspId, status, date, time }),
    });
    setConfirmModal(null);
    setReschedule(null);
    setSuccessMsg(
      status === "confirmed" ? "Inspection confirmed — the requester has been notified."
      : status === "cancelled" ? "Inspection cancelled."
      : "Inspection rescheduled."
    );
    load();
  }

  const verification = {
    verified: { icon: BadgeCheck, cls: "text-lime-600 bg-lime-100", title: "Verification Completed", body: "Property information and supporting documentation have been successfully reviewed." },
    under_review: { icon: Clock3, cls: "text-amber-700 bg-amber-100", title: "Verification In Progress", body: "Our review team is checking your property information and supporting documentation." },
    unverified: { icon: Clock3, cls: "text-neutral-500 bg-neutral-100", title: "Not Yet Verified", body: "Submit supporting documents to begin the verification process." },
    action_required: { icon: X, cls: "text-red-700 bg-red-100", title: "Action Required", body: "Some documents need your attention before verification can continue." },
  }[L.verification_status] ?? { icon: Clock3, cls: "text-neutral-500 bg-neutral-100", title: L.verification_status, body: "" };

  return (
    <div>
      <Topbar />

      <div className="mt-5 flex items-center justify-between">
        <Link href="/dashboard/portfolio" className="flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
          <ArrowLeft size={15} /> Your Portfolio
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setEdit(true)} className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Edit Listing
          </button>
          <button onClick={archive} className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            <Archive size={14} /> {L.status === "archived" ? "Unarchive" : "Archive Listing"}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-lime-100 px-4 py-3 text-sm text-lime-600">
          {successMsg}
          <button onClick={() => setSuccessMsg("")}><X size={15} /></button>
        </div>
      )}

      {/* Header card */}
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/images/property-${L.image_seed}.svg`} alt="" className="h-20 w-28 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-semibold text-neutral-900">{L.estate_name ?? L.title}</span>
            <VerificationBadge status={L.verification_status} />
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
            <MapPin size={12} /> {L.location_area}, {L.location_city}
          </div>
          <div className="mt-1 text-xs text-neutral-400">
            {TYPE_LABEL[L.property_type]}
            {L.land_size_sqm ? ` • ${L.land_size_sqm} sqm` : ""}
            {L.bedrooms ? ` • ${L.bedrooms} Bedroom ${L.property_type === "duplex" ? "Duplex" : ""}` : ""}
          </div>
        </div>
        <div className="text-lg font-bold text-brand-500">{naira(L.price)}</div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Tabs */}
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:items-start lg:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-left text-sm font-medium shadow-sm transition ${
                tab === t ? "bg-blue-100 text-support-blue" : "bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {t}
              {t === "Inquiries" && inquiries.length > 0 && <span className="ml-2 text-xs opacity-70">({inquiries.length})</span>}
              {t === "Inspection Requests" && inspections.length > 0 && <span className="ml-2 text-xs opacity-70">({inspections.length})</span>}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div className="min-h-[400px] rounded-2xl border border-neutral-200 bg-white p-6">
          {tab === "Overview" && (
            <div>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { icon: Eye, label: "Views", value: L.views },
                  { icon: Heart, label: "Saves", value: L.saves },
                  { icon: MessageSquare, label: "Inquiries", value: inquiries.length },
                  { icon: CalendarCheck2, label: "Inspection Requests", value: inspections.length },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bg-neutral-50 p-4">
                    <s.icon size={17} className="text-neutral-400" />
                    <div className="mt-3 text-2xl font-bold text-neutral-900">{s.value}</div>
                    <div className="caption text-neutral-500">{s.label}</div>
                  </div>
                ))}
              </div>
              <h3 className="h4 mt-8 text-neutral-900">Description</h3>
              <p className="body-md mt-2 max-w-[620px] text-neutral-500">{L.description}</p>
              <h3 className="h4 mt-6 text-neutral-900">Listed</h3>
              <p className="body-md mt-1 text-neutral-500">{timeAgo(L.created_at)}</p>
            </div>
          )}

          {tab === "Status & Verification" && (
            <div className="max-w-[560px]">
              <div className="flex flex-col items-center rounded-2xl bg-neutral-50 px-6 py-10 text-center">
                <span className={`flex h-16 w-16 items-center justify-center rounded-full ${verification.cls}`}>
                  <verification.icon size={30} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-neutral-900">{verification.title}</h3>
                <p className="body-md mt-2 max-w-[400px] text-neutral-500">{verification.body}</p>
                <button className="btn-text mt-6 h-10 rounded-xl border border-neutral-200 bg-white px-6 text-neutral-800 hover:bg-neutral-50">
                  Contact Support
                </button>
              </div>
              <h3 className="h4 mt-8 text-neutral-900">Document Review</h3>
              <div className="mt-3 space-y-2">
                {data.documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-5 py-3.5">
                    <span className="flex items-center gap-2.5 text-sm text-neutral-700"><FileText size={15} className="text-neutral-400" /> {d.doc_type}</span>
                    <VerificationBadge status={d.status === "approved" ? "verified" : d.status === "under_review" ? "under_review" : "unverified"} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "Listing Performance" && (
            <div className="max-w-[560px]">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Inquiries", value: `${inquiries.length} Inquiries` },
                  { label: "Inspection Requests", value: `${inspections.filter((i) => i.status === "confirmed").length} Scheduled` },
                  { label: "Saves", value: String(L.saves) },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bg-neutral-50 p-5">
                    <div className="caption text-neutral-500">{s.label}</div>
                    <div className="mt-2 text-xl font-bold text-neutral-900">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-neutral-50 p-5">
                <div className="caption text-neutral-500">Views over time</div>
                <div className="mt-4 flex h-32 items-end gap-2">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const h = 20 + ((L.views * (i + 3)) % 80);
                    return <div key={i} className="flex-1 rounded-t-md bg-brand-500/70" style={{ height: `${h}%` }} />;
                  })}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-neutral-400"><span>12 weeks ago</span><span>This week</span></div>
              </div>
            </div>
          )}

          {tab === "Listing Info" && (
            <div className="max-w-[560px]">
              <div className="mb-4 flex justify-end">
                <button onClick={() => setEdit(true)} className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                  Edit Information
                </button>
              </div>
              <dl className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100">
                {[
                  ["Listing Purpose", L.purpose === "rent" ? "For rent" : "For sale"],
                  ["Price", naira(L.price)],
                  ["Property Type", `${TYPE_LABEL[L.property_type]}${L.land_size_sqm ? ` • ${L.land_size_sqm} sqm` : ""}`],
                  ["Description", L.description ?? "—"],
                  ["Infrastructure", amenities.length ? "• " + amenities.join("  • ") : "—"],
                  ["Location", `${L.location_area}, ${L.location_city}`],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[140px_1fr] gap-4 px-5 py-3.5 text-sm">
                    <dt className="text-neutral-400">{k}</dt>
                    <dd className="text-neutral-700">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {tab === "Uploaded Media" && (
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={i} src={`/images/property-${((L.image_seed + i - 1) % 12) + 1}.svg`} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
              ))}
            </div>
          )}

          {tab === "Listing Documents" && (
            <div className="max-w-[560px] space-y-2">
              {data.documents.length === 0 && <p className="body-md text-neutral-400">No documents uploaded yet.</p>}
              {data.documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <FileText size={17} className="text-neutral-400" />
                    <div>
                      <div className="text-sm font-medium text-neutral-800">{d.doc_type}</div>
                      <div className="text-xs text-neutral-400">{d.file_name}</div>
                    </div>
                  </div>
                  <VerificationBadge status={d.status === "approved" ? "verified" : d.status === "under_review" ? "under_review" : "unverified"} />
                </div>
              ))}
            </div>
          )}

          {tab === "Inspection Requests" && (
            <div className="max-w-[620px] space-y-3">
              {inspections.length === 0 && <p className="body-md text-neutral-400">No inspection requests yet.</p>}
              {inspections.map((i) => (
                <div key={i.id} className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                      {i.requester_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{i.requester_name}</div>
                      <div className="text-xs text-neutral-400">Interested in {L.estate_name ?? L.title}</div>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-neutral-400">Inspection Type</dt>
                      <dd className="font-medium capitalize text-neutral-800">{i.mode} Site Inspection</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-neutral-400">Status</dt>
                      <dd>
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          i.status === "confirmed" ? "bg-lime-100 text-lime-600"
                          : i.status === "cancelled" ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                        }`}>
                          {i.status === "pending" ? "Awaiting Confirmation" : i.status}
                        </span>
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-neutral-400">Preferred Date & Time</dt>
                      <dd className="font-medium text-neutral-800">{i.date} • {i.time}</dd>
                    </div>
                  </dl>
                  {i.notes && <p className="body-r mt-2 text-neutral-400">&ldquo;{i.notes}&rdquo;</p>}
                  {(i.status === "pending" || i.status === "rescheduled") && (
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => setConfirmModal({ insp: i, action: "confirmed" })}
                        className="btn-text flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-brand-900 text-white transition hover:bg-brand-500"
                      >
                        <Check size={14} /> Confirm Schedule
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => { setReschedule(i); setRsDate(i.date); setRsTime(i.time); }}
                          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          <CalendarClock size={13} /> Reschedule
                        </button>
                        <button
                          onClick={() => setConfirmModal({ insp: i, action: "cancelled" })}
                          className="flex h-10 items-center justify-center rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:border-red-300 hover:text-red-600"
                        >
                          Cancel Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "Inquiries" && (
            <div className="max-w-[620px] space-y-3">
              {inquiries.length === 0 && <p className="body-md text-neutral-400">No inquiries yet.</p>}
              {inquiries.map((q) => (
                <button key={q.id} onClick={() => setViewInq(q)} className="block w-full rounded-xl border border-neutral-100 p-4 text-left transition hover:border-neutral-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-900">{q.sender_name}</span>
                    <span className="text-xs text-neutral-400">{timeAgo(q.created_at)}</span>
                  </div>
                  <p className="body-md mt-1 line-clamp-2 text-neutral-500">{q.message}</p>
                  <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                    q.status === "new" ? "bg-blue-100 text-blue-700" : "bg-neutral-100 text-neutral-500"
                  }`}>{q.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit drawer */}
      {edit && (
        <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-[2px]" onClick={() => setEdit(false)}>
          <div className="absolute inset-y-0 right-0 flex w-full max-w-[426px] flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
              <h2 className="h4 text-neutral-900">Edit Listing</h2>
              <button onClick={() => setEdit(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100"><X size={18} /></button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 scroll-thin">
              <label className="block">
                <span className="label-sm mb-2 block text-neutral-900">Title</span>
                <input value={eTitle} onChange={(e) => setETitle(e.target.value)} className="h-11 w-full rounded-xl bg-neutral-100 px-4 text-sm outline-none focus:ring-2 focus:ring-brand-500/40" />
              </label>
              <label className="block">
                <span className="label-sm mb-2 block text-neutral-900">Price</span>
                <input
                  value={ePrice ? "₦" + Number(ePrice).toLocaleString() : ""}
                  onChange={(e) => setEPrice(e.target.value.replace(/\D/g, ""))}
                  className="h-11 w-full rounded-xl bg-neutral-100 px-4 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </label>
              <label className="block">
                <span className="label-sm mb-2 block text-neutral-900">Description</span>
                <textarea rows={6} value={eDesc} onChange={(e) => setEDesc(e.target.value)} className="w-full rounded-xl bg-neutral-100 p-4 text-sm outline-none focus:ring-2 focus:ring-brand-500/40" />
              </label>
            </div>
            <div className="border-t border-neutral-100 px-6 py-4">
              <button onClick={saveEdit} disabled={eSaving} className="btn-text h-12 w-full rounded-xl bg-brand-900 text-white hover:bg-brand-500 disabled:opacity-60">
                {eSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm / cancel modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-6" onClick={() => setConfirmModal(null)}>
          <div className="w-full max-w-[380px] rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-neutral-900">
              {confirmModal.action === "confirmed" ? "Confirm this inspection?" : "Cancel this inspection?"}
            </h3>
            <p className="body-md mt-2 text-neutral-500">
              {confirmModal.insp.requester_name} — {confirmModal.insp.date} at {confirmModal.insp.time} ({confirmModal.insp.mode}).
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmModal(null)} className="btn-text h-11 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50">Back</button>
              <button
                onClick={() => setInspStatus(confirmModal.insp.id, confirmModal.action)}
                className={`btn-text h-11 rounded-xl text-white ${confirmModal.action === "confirmed" ? "bg-brand-900 hover:bg-brand-500" : "bg-red-600 hover:bg-red-500"}`}
              >
                {confirmModal.action === "confirmed" ? "Confirm" : "Cancel It"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule modal */}
      {reschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-6" onClick={() => setReschedule(null)}>
          <div className="w-full max-w-[380px] rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-center text-lg font-semibold text-neutral-900">Reschedule Inspection</h3>
            <p className="body-md mt-1 text-center text-neutral-500">{reschedule.requester_name}</p>
            <div className="mt-5 flex items-center gap-3">
              <input type="date" value={rsDate} onChange={(e) => setRsDate(e.target.value)} className="h-11 flex-1 rounded-xl bg-neutral-100 px-3 text-sm outline-none" />
              <span className="text-sm text-neutral-400">at</span>
              <input type="time" value={rsTime} onChange={(e) => setRsTime(e.target.value)} className="h-11 flex-1 rounded-xl bg-neutral-100 px-3 text-sm outline-none" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setReschedule(null)} className="btn-text h-11 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50">Back</button>
              <button onClick={() => setInspStatus(reschedule.id, "rescheduled", rsDate, rsTime)} className="btn-text h-11 rounded-xl bg-brand-900 text-white hover:bg-brand-500">
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inquiry view modal */}
      {viewInq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-6" onClick={() => setViewInq(null)}>
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">{viewInq.sender_name}</h3>
              <span className="text-xs text-neutral-400">{timeAgo(viewInq.created_at)}</span>
            </div>
            <p className="body-md mt-3 rounded-xl bg-neutral-50 p-4 text-neutral-700">{viewInq.message}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => setViewInq(null)} className="btn-text h-11 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50">Close</button>
              <button
                onClick={async () => {
                  await fetch("/api/inquiries", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: viewInq.id, status: "replied" }) });
                  setViewInq(null);
                  load();
                }}
                className="btn-text h-11 rounded-xl bg-brand-900 text-white hover:bg-brand-500"
              >
                Mark Replied
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
