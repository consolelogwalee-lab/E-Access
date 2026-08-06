"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileText, ImagePlus, Plus, ShieldCheck, Stamp, Trash2, X } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";

type Request = {
  id: number; reference: string; property_title: string; property_type: string;
  address: string; city: string; state: string; status: string; created_at: string;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  submitted: { label: "Submitted", cls: "bg-blue-50 text-blue-700" },
  in_review: { label: "Under Review", cls: "bg-amber-50 text-amber-700" },
  legal_review: { label: "With Legal Team", cls: "bg-purple-50 text-purple-700" },
  action_required: { label: "Action Required", cls: "bg-red-50 text-red-600" },
  approved: { label: "Approved & Stamped", cls: "bg-lime-50 text-lime-700" },
  rejected: { label: "Not Approved", cls: "bg-neutral-100 text-neutral-500" },
};

const TITLE_TYPES = [
  "Certificate of Occupancy (C of O)", "Governor's Consent", "Deed of Assignment",
  "Registered Survey", "Excision / Gazette", "Allocation Letter", "Not sure / Other",
];
const DOC_TYPES = [
  "Certificate of Occupancy", "Survey Plan", "Deed of Assignment", "Governor's Consent",
  "Excision / Gazette", "Allocation Letter", "Purchase Receipt", "Other Supporting Document",
];

export default function ValidatePage() {
  const [requests, setRequests] = useState<Request[] | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ propertyTitle: "", propertyType: "land", address: "", city: "", state: "Lagos", titleType: TITLE_TYPES[0], notes: "" });
  const [docs, setDocs] = useState<{ docType: string; fileName: string; storagePath?: string | null; uploading?: boolean }[]>([]);
  const [photos, setPhotos] = useState<{ fileName: string; storagePath?: string | null }[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  async function uploadOne(f: File): Promise<string | null> {
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("kind", "document");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      return d.ok ? d.path : null;
    } catch { return null; }
  }
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<null | { reference: string; id: number }>(null);
  const docInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch("/api/validations").then((r) => r.json()).then((d) => setRequests(d.requests ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  function reset() {
    setOpen(false); setStep(1); setErr(""); setDone(null);
    setForm({ propertyTitle: "", propertyType: "land", address: "", city: "", state: "Lagos", titleType: TITLE_TYPES[0], notes: "" });
    setDocs([]); setPhotos([]);
  }

  async function submit() {
    setErr("");
    const res = await fetch("/api/validations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, documents: docs, photos }),
    });
    const d = await res.json();
    if (!res.ok) { setErr(d.error ?? "Could not submit."); return; }
    setDone({ reference: d.reference, id: d.id });
    load();
  }

  const input = "mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400";
  const label = "mt-4 block text-xs font-semibold text-neutral-500";

  return (
    <div>
      <Topbar crumbs={[["Main", "/dashboard"], ["Verify Property", ""]]} showRegion={false} />

      <div className="mt-6 overflow-hidden rounded-2xl bg-[#04040a] text-white">
        <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:gap-6 md:p-9">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#E2A600]/40 bg-[#E2A600]/10 md:h-14 md:w-14">
            <Stamp size={24} className="text-[#E2A600]" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[21px] font-extrabold leading-tight tracking-[-0.02em] md:text-[25px]">Property &amp; Document Validation</h1>
            <p className="body-md mt-2 text-white/60 md:max-w-[560px]">
              Own a property already? Upload your documents and photos, and the E-Access team,
              working with legal partners, will verify the title, check the registry, and stamp
              it if everything holds. You get a verification certificate at the end.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="btn-gold flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-[14px] md:w-auto"
          >
            <Plus size={16} /> Verify a property
          </button>
        </div>
        <div className="grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-4">
          {["1. Upload documents", "2. Expert review", "3. Legal & registry checks", "4. Approved & stamped"].map((s) => (
            <div key={s} className="bg-[#04040a] px-6 py-3.5 text-xs font-medium text-white/50">{s}</div>
          ))}
        </div>
      </div>

      <h2 className="label-lg mt-8 text-neutral-900">Your validation requests</h2>
      <div className="mt-4 space-y-2">
        {requests === null && <div className="h-32 animate-pulse rounded-2xl bg-white" />}
        {requests?.length === 0 && (
          <div className="flex h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
            <p className="body-md text-neutral-400">No requests yet. Verify your first property above.</p>
          </div>
        )}
        {requests?.map((r) => {
          const meta = STATUS_META[r.status] ?? STATUS_META.submitted;
          return (
            <Link key={r.id} href={`/dashboard/validate/${r.id}`} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-400">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                <FileText size={18} className="text-neutral-500" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-neutral-900">{r.property_title}</span>
                <span className="block truncate text-xs text-neutral-400">
                  {r.reference} • {r.address}, {r.city}, {r.state}
                </span>
              </span>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
            </Link>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-[2px]" onClick={reset}>
          <div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl scroll-thin" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="py-6 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime-100 text-lime-600"><ShieldCheck size={26} /></span>
                <h2 className="h4 mt-4 text-neutral-900">Request submitted</h2>
                <p className="body-md mx-auto mt-2 max-w-[380px] text-neutral-500">
                  Your reference is <span className="font-semibold text-neutral-800">{done.reference}</span>.
                  The verification team has been notified and you will get updates at every stage.
                </p>
                <Link href={`/dashboard/validate/${done.id}`} className="btn-text mt-5 inline-block rounded-full bg-neutral-950 px-6 py-3 text-white">
                  Track this request
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="h4 text-neutral-900">Verify a property {step === 1 ? "· Details" : "· Documents & Photos"}</h2>
                  <button onClick={reset} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100" aria-label="Close"><X size={17} /></button>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {[1, 2].map((s) => <span key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-[#E2A600]" : "bg-neutral-100"}`} />)}
                </div>

                {step === 1 ? (
                  <>
                    <label className={label}>Property name / short description</label>
                    <input value={form.propertyTitle} onChange={(e) => setForm({ ...form, propertyTitle: e.target.value })} className={input} placeholder="e.g. 2 plots of land at Eleko, Ibeju-Lekki" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={label}>Property type</label>
                        <select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} className={`${input} bg-white`}>
                          <option value="land">Land</option><option value="apartment">Apartment</option>
                          <option value="duplex">Duplex / House</option><option value="commercial">Commercial</option>
                        </select>
                      </div>
                      <div>
                        <label className={label}>Title document you hold</label>
                        <select value={form.titleType} onChange={(e) => setForm({ ...form, titleType: e.target.value })} className={`${input} bg-white`}>
                          {TITLE_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <label className={label}>Property address</label>
                    <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={input} placeholder="Street / estate / plot number" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={label}>City / Area</label>
                        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input} placeholder="e.g. Ibeju-Lekki" />
                      </div>
                      <div>
                        <label className={label}>State</label>
                        <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={input} placeholder="e.g. Lagos" />
                      </div>
                    </div>
                    <label className={label}>Anything the team should know? (optional)</label>
                    <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={input} placeholder="e.g. bought from a family, omonile matter, ongoing dispute…" />
                    {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
                    <button
                      onClick={() => {
                        if (!form.propertyTitle || !form.address || !form.city || !form.state) { setErr("Fill in the property name, address, city and state."); return; }
                        setErr(""); setStep(2);
                      }}
                      className="btn-text mt-5 h-12 w-full rounded-xl bg-neutral-950 text-white hover:bg-neutral-800"
                    >
                      Continue to documents
                    </button>
                  </>
                ) : (
                  <>
                    <p className="body-md mt-3 text-neutral-500">
                      Attach scans or clear photos of your documents. The more you provide, the faster verification goes.
                    </p>
                    <div className="mt-4 flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-neutral-500">Document type</label>
                        <select value={docType} onChange={(e) => setDocType(e.target.value)} className={`${input} bg-white`}>
                          {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <button onClick={() => docInput.current?.click()} className="btn-text flex h-[46px] items-center gap-2 rounded-xl border border-neutral-300 px-4 text-neutral-800 hover:bg-neutral-50">
                        <FileText size={15} /> Attach
                      </button>
                      <input ref={docInput} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (!f) return;
                        const entry = { docType, fileName: f.name, uploading: true };
                        setDocs((d) => [...d, entry]);
                        const path = await uploadOne(f);
                        setDocs((d) => d.map((x) => (x === entry || (x.fileName === f.name && x.uploading) ? { ...x, uploading: false, storagePath: path } : x)));
                      }} />
                    </div>
                    {docs.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {docs.map((d, i) => (
                          <li key={i} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm">
                            <span className="min-w-0 truncate text-neutral-700">
                              <span className="font-medium">{d.docType}:</span> {d.fileName}
                              {d.uploading ? <span className="ml-2 text-xs text-amber-600">uploading…</span> : d.storagePath ? <span className="ml-2 text-xs text-lime-600">uploaded</span> : null}
                            </span>
                            <button onClick={() => setDocs(docs.filter((_, j) => j !== i))} aria-label="Remove document" className="ml-2 text-neutral-400 hover:text-red-500"><Trash2 size={14} /></button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <button onClick={() => photoInput.current?.click()} className="btn-text mt-4 flex h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 text-neutral-600 hover:bg-neutral-50">
                      <ImagePlus size={15} /> Add property photos (optional)
                    </button>
                    <input ref={photoInput} type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      e.target.value = "";
                      if (!files.length) return;
                      setUploadingPhotos(true);
                      for (const f of files) {
                        const path = await uploadOne(f);
                        setPhotos((p) => [...p, { fileName: f.name, storagePath: path }]);
                      }
                      setUploadingPhotos(false);
                    }} />
                    {(photos.length > 0 || uploadingPhotos) && (
                      <p className="mt-2 text-xs text-neutral-500">
                        {photos.length} photo{photos.length === 1 ? "" : "s"} attached: {photos.map((p) => p.fileName).join(", ")}
                        {uploadingPhotos ? " (uploading…)" : ""}
                      </p>
                    )}

                    {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
                    <div className="mt-5 flex gap-2">
                      <button onClick={() => setStep(1)} className="btn-text h-12 flex-1 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200">Back</button>
                      <button onClick={submit} className="btn-text h-12 flex-1 rounded-xl bg-[#E2A600] text-[#3f3005] hover:brightness-105">Submit for verification</button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
