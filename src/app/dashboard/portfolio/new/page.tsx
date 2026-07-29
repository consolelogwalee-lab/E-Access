"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X, ArrowLeft, UploadCloud, FileText, Trash2, BadgeCheck, ChevronDown, Film,
} from "lucide-react";

type PType = "land" | "apartment" | "duplex" | "commercial";

const TYPE_OPTIONS: { key: PType; label: string }[] = [
  { key: "land", label: "Residential Land" },
  { key: "apartment", label: "Apartment" },
  { key: "duplex", label: "Duplex" },
  { key: "commercial", label: "Commercial Property" },
];

const TITLE_DOCS = ["C of O", "Governor's Consent", "Deed of Assignment", "Registered Survey", "Excision"];
const INFRA = ["Road Access", "Drainage", "Electricity", "Water Supply", "Perimeter Fencing", "Street Lighting"];
const AMENITIES = ["Elevator", "Swimming Pool", "Gym", "Security", "Backup Power", "Parking", "Internet Access"];

const selectCls =
  "h-11 w-full appearance-none rounded-xl bg-neutral-100 px-4 pr-9 text-sm outline-none focus:ring-2 focus:ring-brand-500/40";
const inputCls =
  "h-11 w-full rounded-xl bg-neutral-100 px-4 text-sm outline-none focus:ring-2 focus:ring-brand-500/40";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
        active ? "border-brand-500 bg-brand-500 text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
      }`}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="label-sm mb-2 block text-neutral-900">{children}</span>;
}

type FileMeta = { name: string; size: number; kind: "media" | "doc"; path?: string; url?: string | null; uploading?: boolean };

export default function AddListingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [newId, setNewId] = useState<number | null>(null);

  // Step 1 fields
  const [ptype, setPtype] = useState<PType>("land");
  const [purpose, setPurpose] = useState<"sale" | "rent">("sale");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [landSize, setLandSize] = useState("");
  const [landCategory, setLandCategory] = useState("Estate Plot");
  const [topography, setTopography] = useState("Dry Land");
  const [estateStatus, setEstateStatus] = useState("Inside Estate");
  const [roadAccess, setRoadAccess] = useState("Tarred Road");
  const [suitableFor, setSuitableFor] = useState("Residential Development");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [floorLevel, setFloorLevel] = useState("Ground Floor");
  const [furnishing, setFurnishing] = useState("Unfurnished");
  const [occupancy, setOccupancy] = useState("Ready to Move In");
  const [balcony, setBalcony] = useState("Yes");
  const [titleDocs, setTitleDocs] = useState<string[]>([]);
  const [infra, setInfra] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  // Steps 2/3 uploads (metadata only in demo)
  const [media, setMedia] = useState<FileMeta[]>([]);
  const [docs, setDocs] = useState<FileMeta[]>([]);
  const mediaRef = useRef<HTMLInputElement>(null);
  const docsRef = useRef<HTMLInputElement>(null);

  const isLand = ptype === "land";
  const isApt = ptype === "apartment" || ptype === "duplex";

  const step1Valid = useMemo(() => {
    if (!location.trim() || !price) return false;
    if (isLand && !landSize) return false;
    if (isApt && !bedrooms) return false;
    return true;
  }, [location, price, landSize, bedrooms, isLand, isApt]);

  function toggle(arr: string[], set: (v: string[]) => void, v: string) {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  async function addFiles(list: FileList | null, kind: "media" | "doc") {
    if (!list) return;
    const files = Array.from(list);
    const setter = kind === "media" ? setMedia : setDocs;
    const cap = kind === "media" ? 12 : 8;
    // show immediately as uploading
    setter((prev) => [...prev, ...files.map((f) => ({ name: f.name, size: f.size, kind, uploading: true }))].slice(0, cap));
    for (const f of files) {
      try {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("kind", kind === "media" ? "photo" : "document");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await res.json();
        setter((prev) => prev.map((m) =>
          m.name === f.name && m.uploading
            ? { ...m, uploading: false, path: d.ok ? d.path : undefined, url: d.ok ? d.url : undefined }
            : m
        ));
      } catch {
        setter((prev) => prev.map((m) => (m.name === f.name && m.uploading ? { ...m, uploading: false } : m)));
      }
    }
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    const [area, city] = location.split(",").map((s) => s.trim());
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: buildTitle(),
        propertyType: ptype,
        purpose,
        price: Number(price.replace(/\D/g, "")),
        locationArea: area ?? location,
        locationCity: city ?? "",
        bedrooms: bedrooms || null,
        bathrooms: bathrooms || null,
        landSize: landSize || null,
        description,
        amenities: [...infra, ...amenities, ...(isLand ? [landCategory, topography, estateStatus, roadAccess, suitableFor] : [furnishing, floorLevel, occupancy])].filter(Boolean),
        documents: [
          ...titleDocs.map((t) => ({ type: t, fileName: `${t.toLowerCase().replace(/[^a-z]+/g, "_")}.pdf` })),
          ...docs.map((d) => ({ type: "Supporting Document", fileName: d.name, storagePath: d.path ?? null })),
        ],
        photos: media.filter((m) => m.url).map((m) => m.url),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Submission failed.");
    setNewId(data.id);
    setSubmissionId(`EAL-2026-${String(data.id).padStart(5, "0")}`);
    setStep(5);
  }

  function buildTitle() {
    const loc = location.split(",")[0]?.trim() || "Nigeria";
    const forWhat = purpose === "rent" ? "for rent" : "for sale";
    if (isLand) return `${landCategory} in ${loc} ${forWhat}`;
    if (ptype === "commercial") return `Commercial property in ${loc} ${forWhat}`;
    return `${bedrooms || ""} bedroom ${ptype} in ${loc} ${forWhat}`.trim();
  }

  const stepTitle = ["", "Start Your Listing Submission", "Upload Property Media", "Property Documentation", "Verification Review", "Listing Submitted Successfully"][step];
  const stepSub = [
    "",
    "Provide basic property information to begin the verification and listing process.",
    "Add clear images and supporting visuals to help reviewers verify your listing information.",
    "Uploaded documents are reviewed privately to support listing verification and improve buyer trust.",
    "E-Access reviews submitted property information and documentation before listings become publicly visible.",
    "Your property submission has been received and is now undergoing verification review before publication.",
  ][step];

  if (step === 5) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-6 backdrop-blur-[2px]">
        <div className="w-full max-w-[420px] rounded-3xl bg-white p-8 text-center shadow-2xl">
          <svg width="72" height="88" viewBox="0 0 72 88" className="mx-auto">
            <polygon points="26,0 46,0 40,34 32,34" fill="#2563eb" />
            <polygon points="46,0 66,0 48,38 40,34" fill="#3b82f6" />
            <circle cx="40" cy="56" r="24" fill="#f59e0b" />
            <circle cx="40" cy="56" r="18" fill="#fbbf24" />
            <path d="M40 44l3.5 7.5 8 1-6 5.5 1.5 8-7-4-7 4 1.5-8-6-5.5 8-1z" fill="#fde68a" />
          </svg>
          <h2 className="mt-5 text-xl font-semibold text-neutral-900">Listing Submitted Successfully</h2>
          <p className="body-md mt-2 text-neutral-500">
            Your property submission has been received and is now undergoing verification review before publication.
          </p>
          <dl className="mt-6 divide-y divide-neutral-100 rounded-2xl border border-neutral-100 text-left">
            {[
              ["Submission ID", submissionId],
              ["Current Status", "Submitted"],
              ["Estimated Review Stage", "Initial documentation review in progress."],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <dt className="shrink-0 text-neutral-400">{k}</dt>
                <dd className="text-right font-medium text-neutral-800">{v}</dd>
              </div>
            ))}
          </dl>
          <button
            onClick={() => router.push(newId ? `/dashboard/portfolio/${newId}` : "/dashboard/portfolio")}
            className="btn-text mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-brand-900 text-white transition hover:bg-brand-500"
          >
            Track Verification Status →
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-text mt-2 h-12 w-full rounded-xl border border-neutral-200 text-neutral-800 transition hover:bg-neutral-50"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-[2px]">
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[426px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
          <div className="flex items-center gap-3">
            {step > 1 && step < 5 && (
              <button onClick={() => setStep((s) => s - 1)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100">
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="text-base font-semibold text-neutral-900">{stepTitle}</h2>
              {step < 5 && <span className="text-xs text-neutral-400">{step}/5</span>}
            </div>
          </div>
          <button onClick={() => router.push("/dashboard/portfolio")} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 scroll-thin">
          <p className="body-r mb-6 text-neutral-400">{stepSub}</p>

          {/* ============ STEP 1 ============ */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label>Property Type</Label>
                <div className="relative">
                  <select value={ptype} onChange={(e) => setPtype(e.target.value as PType)} className={selectCls}>
                    {TYPE_OPTIONS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>

              <div>
                <Label>Listing Purpose</Label>
                <div className="flex rounded-full bg-neutral-100 p-1">
                  {[["sale", "For Sale"], ["rent", "For Rent"]].map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPurpose(v as "sale" | "rent")}
                      className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        purpose === v ? "bg-neutral-950 text-white" : "text-neutral-500"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Location</Label>
                <input className={inputCls} placeholder="e.g. Ikorodu, Lagos State" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>

              {isLand && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Land Size</Label>
                      <div className="relative">
                        <input className={inputCls} placeholder="0" value={landSize} onChange={(e) => setLandSize(e.target.value.replace(/\D/g, ""))} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400">Sqm</span>
                      </div>
                    </div>
                    <div>
                      <Label>Land Category</Label>
                      <div className="relative">
                        <select value={landCategory} onChange={(e) => setLandCategory(e.target.value)} className={selectCls}>
                          {["Estate Plot", "Corner Piece", "Commercial Plot", "Farmland"].map((o) => <option key={o}>{o}</option>)}
                        </select>
                        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Title Documentation</Label>
                    <div className="flex flex-wrap gap-2">
                      {TITLE_DOCS.map((d) => (
                        <Chip key={d} active={titleDocs.includes(d)} onClick={() => toggle(titleDocs, setTitleDocs, d)}>{d}</Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Infrastructure Availability</Label>
                    <div className="space-y-2.5">
                      {INFRA.map((d) => (
                        <label key={d} className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-700">
                          <input
                            type="checkbox"
                            checked={infra.includes(d)}
                            onChange={() => toggle(infra, setInfra, d)}
                            className="h-4 w-4 rounded border-neutral-300 accent-[#0d06a7]"
                          />
                          {d}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Topography</Label>
                      <div className="relative">
                        <select value={topography} onChange={(e) => setTopography(e.target.value)} className={selectCls}>
                          {["Dry Land", "Gentle Slope", "Wetland (Reclaimed)"].map((o) => <option key={o}>{o}</option>)}
                        </select>
                        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      </div>
                    </div>
                    <div>
                      <Label>Estate Status</Label>
                      <div className="relative">
                        <select value={estateStatus} onChange={(e) => setEstateStatus(e.target.value)} className={selectCls}>
                          {["Inside Estate", "Outside Estate"].map((o) => <option key={o}>{o}</option>)}
                        </select>
                        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Road Access</Label>
                      <div className="relative">
                        <select value={roadAccess} onChange={(e) => setRoadAccess(e.target.value)} className={selectCls}>
                          {["Tarred Road", "Graded Road", "Untarred Road"].map((o) => <option key={o}>{o}</option>)}
                        </select>
                        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      </div>
                    </div>
                    <div>
                      <Label>Suitable For</Label>
                      <div className="relative">
                        <select value={suitableFor} onChange={(e) => setSuitableFor(e.target.value)} className={selectCls}>
                          {["Residential Development", "Commercial Development", "Mixed Use", "Agriculture"].map((o) => <option key={o}>{o}</option>)}
                        </select>
                        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {(isApt || ptype === "commercial") && (
                <>
                  {isApt && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Bedroom</Label>
                        <input className={inputCls} placeholder="2" value={bedrooms} onChange={(e) => setBedrooms(e.target.value.replace(/\D/g, ""))} />
                      </div>
                      <div>
                        <Label>Bathroom</Label>
                        <input className={inputCls} placeholder="1" value={bathrooms} onChange={(e) => setBathrooms(e.target.value.replace(/\D/g, ""))} />
                      </div>
                    </div>
                  )}
                  {ptype === "commercial" && (
                    <div>
                      <Label>Floor Area</Label>
                      <div className="relative">
                        <input className={inputCls} placeholder="0" value={landSize} onChange={(e) => setLandSize(e.target.value.replace(/\D/g, ""))} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400">Sqm</span>
                      </div>
                    </div>
                  )}
                  {isApt && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Floor Level</Label>
                          <div className="relative">
                            <select value={floorLevel} onChange={(e) => setFloorLevel(e.target.value)} className={selectCls}>
                              {["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor+", "Penthouse"].map((o) => <option key={o}>{o}</option>)}
                            </select>
                            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                          </div>
                        </div>
                        <div>
                          <Label>Furnishing</Label>
                          <div className="relative">
                            <select value={furnishing} onChange={(e) => setFurnishing(e.target.value)} className={selectCls}>
                              {["Fully Furnished", "Semi Furnished", "Unfurnished"].map((o) => <option key={o}>{o}</option>)}
                            </select>
                            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Building Amenities</Label>
                        <div className="grid grid-cols-2 gap-2.5">
                          {AMENITIES.map((d) => (
                            <label key={d} className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-700">
                              <input
                                type="checkbox"
                                checked={amenities.includes(d)}
                                onChange={() => toggle(amenities, setAmenities, d)}
                                className="h-4 w-4 rounded border-neutral-300 accent-[#0d06a7]"
                              />
                              {d}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Occupancy Status</Label>
                          <div className="relative">
                            <select value={occupancy} onChange={(e) => setOccupancy(e.target.value)} className={selectCls}>
                              {["Ready to Move In", "Occupied (Tenanted)", "Under Construction"].map((o) => <option key={o}>{o}</option>)}
                            </select>
                            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                          </div>
                        </div>
                        <div>
                          <Label>Balcony / Outdoor</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {["Yes", "No"].map((o) => (
                              <button
                                key={o}
                                type="button"
                                onClick={() => setBalcony(o)}
                                className={`h-11 rounded-xl border text-sm font-medium transition ${
                                  balcony === o ? "border-brand-500 bg-brand-500/5 text-brand-500" : "border-neutral-200 text-neutral-600"
                                }`}
                              >
                                {o}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <div>
                <Label>Description</Label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl bg-neutral-100 p-4 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
                  placeholder="Describe the property, surrounding infrastructure, accessibility, and notable features..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <Label>Price</Label>
                <input
                  className={inputCls}
                  placeholder="₦18,500,000"
                  value={price ? "₦" + Number(price).toLocaleString() : ""}
                  onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>
          )}

          {/* ============ STEP 2: MEDIA ============ */}
          {step === 2 && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => mediaRef.current?.click()}
                className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-neutral-200 px-6 py-10 text-center transition hover:border-brand-500/50"
              >
                <UploadCloud size={28} className="text-neutral-400" />
                <span className="mt-3 text-sm font-semibold text-neutral-900">Upload Image/Video</span>
                <span className="body-r mt-1 text-neutral-400">Drag and drop or browse files</span>
                <span className="caption mt-2 text-neutral-400">Supports PNG, JPG, JPEG, MP4</span>
              </button>
              <input ref={mediaRef} type="file" multiple accept="image/*,video/mp4" hidden onChange={(e) => addFiles(e.target.files, "media")} />
              <p className="caption text-neutral-400">
                Use clear, well-lit images showing important property areas and surroundings. Max 12 media files, each under 25MB.
              </p>
              {media.length > 0 && (
                <div>
                  <div className="label-sm mb-2 text-neutral-900">Your Attachments: <span className="text-neutral-400">({media.length})</span></div>
                  <div className="space-y-2">
                    {media.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-neutral-100 px-4 py-3">
                        {f.name.endsWith(".mp4") ? <Film size={16} className="text-neutral-400" /> : <FileText size={16} className="text-neutral-400" />}
                        <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">{f.name}</span>
                        <span className="text-xs text-neutral-400">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                        <button onClick={() => setMedia((m) => m.filter((_, j) => j !== i))} className="text-neutral-300 hover:text-red-500">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ STEP 3: DOCS ============ */}
          {step === 3 && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => docsRef.current?.click()}
                className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-neutral-200 px-6 py-10 text-center transition hover:border-brand-500/50"
              >
                <UploadCloud size={28} className="text-neutral-400" />
                <span className="mt-3 text-sm font-semibold text-neutral-900">Upload Documents</span>
                <span className="body-r mt-1 text-neutral-400">Drag and drop or browse files</span>
                <span className="caption mt-2 text-neutral-400">Supports PDF, WORD, DOCX, CSV, TXT</span>
              </button>
              <input ref={docsRef} type="file" multiple accept=".pdf,.doc,.docx,.csv,.txt" hidden onChange={(e) => addFiles(e.target.files, "doc")} />
              <p className="caption text-neutral-400">
                Survey Plan • Allocation Letter • Certificate of Occupancy • Deed of Assignment • Layout Approval. Max file size 10MB.
              </p>
              {docs.length > 0 && (
                <div>
                  <div className="label-sm mb-2 text-neutral-900">Your Attachments: <span className="text-neutral-400">({docs.length})</span></div>
                  <div className="space-y-2">
                    {docs.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-neutral-100 px-4 py-3">
                        <FileText size={16} className="text-neutral-400" />
                        <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">{f.name}</span>
                        <span className="text-xs text-neutral-400">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                        <button onClick={() => setDocs((d) => d.filter((_, j) => j !== i))} className="text-neutral-300 hover:text-red-500">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="caption text-neutral-400">Documents are securely reviewed and are not publicly shared without authorisation.</p>
            </div>
          )}

          {/* ============ STEP 4: REVIEW ============ */}
          {step === 4 && (
            <dl className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100">
              {[
                ["Property type", TYPE_OPTIONS.find((t) => t.key === ptype)?.label ?? ptype],
                ["Location", location || "—"],
                ["Listing purpose", purpose === "rent" ? "For Rent" : "For Sale"],
                ["Price", price ? "₦" + Number(price).toLocaleString() : "—"],
                ["Uploaded media count", String(media.length)],
                ["Document count", String(docs.length + titleDocs.length)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  <dt className="text-neutral-400">{k}</dt>
                  <dd className="font-medium text-neutral-800">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* ============ STEP 5: SUCCESS ============ */}
          {step === 5 && (
            <div className="flex flex-col items-center pt-6 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-lime-100">
                <BadgeCheck size={38} className="text-lime-600" />
              </span>
              <dl className="mt-8 w-full divide-y divide-neutral-100 rounded-2xl border border-neutral-100 text-left">
                {[
                  ["Submission ID", submissionId],
                  ["Current Status", "Submitted"],
                  ["Estimated Review Stage", "Initial documentation review in progress."],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                    <dt className="shrink-0 text-neutral-400">{k}</dt>
                    <dd className="text-right font-medium text-neutral-800">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 px-6 py-4">
          {step === 1 && (
            <button
              onClick={() => step1Valid && setStep(2)}
              disabled={!step1Valid}
              className={`btn-text h-12 w-full rounded-xl transition ${step1Valid ? "bg-brand-900 text-white hover:bg-brand-500" : "bg-neutral-300 text-white"}`}
            >
              Continue
            </button>
          )}
          {(step === 2 || step === 3) && (
            <button onClick={() => setStep(step + 1)} className="btn-text h-12 w-full rounded-xl bg-brand-900 text-white transition hover:bg-brand-500">
              Continue
            </button>
          )}
          {step === 4 && (
            <button onClick={submit} disabled={busy} className="btn-text h-12 w-full rounded-xl bg-brand-900 text-white transition hover:bg-brand-500 disabled:opacity-60">
              {busy ? "Submitting…" : "Submit for Review"}
            </button>
          )}
          {step === 5 && (
            <div className="space-y-2">
              <button
                onClick={() => router.push(newId ? `/dashboard/portfolio/${newId}` : "/dashboard/portfolio")}
                className="btn-text h-12 w-full rounded-xl bg-brand-900 text-white transition hover:bg-brand-500"
              >
                Track Verification Status
              </button>
              <button onClick={() => router.push("/dashboard")} className="btn-text h-12 w-full rounded-xl border border-neutral-200 text-neutral-800 transition hover:bg-neutral-50">
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
