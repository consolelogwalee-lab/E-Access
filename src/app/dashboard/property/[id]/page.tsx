"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Heart, MapPin, BadgeCheck, MessageSquare } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { ListingCard, type Listing } from "@/components/ListingCard";
import { VerificationBadge, Pill } from "@/components/Badges";
import { BookInspectionDrawer } from "@/components/dashboard/BookInspection";
import { MortgageCalculator } from "@/components/dashboard/MortgageCalculator";
import { naira, TYPE_LABEL } from "@/lib/format";

type Doc = { id: number; doc_type: string; file_name: string; status: string };
type Full = Listing & {
  description: string | null; amenities_json: string | null; views: number;
  purpose: string; toilets: number | null; estate_name: string | null;
  owner_id: number | null; owner_name: string | null; owner_color: string | null;
};

export default function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ listing: Full; documents: Doc[]; similar: Listing[]; saved: boolean } | null>(null);
  const [book, setBook] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inqOpen, setInqOpen] = useState(false);
  const [quickDate, setQuickDate] = useState("");
  const [quickTime, setQuickTime] = useState("");
  const [inqMsg, setInqMsg] = useState("");
  const [inqSent, setInqSent] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setSaved(!!d.saved); });
  }, [id]);

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

  async function toggleSave() {
    setSaved((s) => !s);
    await fetch(`/api/listings/${L.id}/save`, { method: "POST" });
  }

  async function sendInquiry() {
    if (!inqMsg.trim()) return;
    await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: L.id, message: inqMsg }),
    });
    setInqSent(true);
  }

  return (
    <div>
      <Topbar />

      <div className="mt-5 flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          <ArrowLeft size={15} /> Back
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-[34px] leading-[1.15] text-neutral-950">{L.estate_name ?? L.title}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-500">
            <MapPin size={14} /> {L.location_area}, <span className="font-semibold text-neutral-800">{L.location_city}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={toggleSave}
            className={`flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition ${
              saved ? "border-red-200 bg-red-50 text-red-600" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <Heart size={14} className={saved ? "fill-red-500 text-red-500" : ""} /> {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_190px]">
        <div className="relative overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/images/property-${L.image_seed}.svg`}
            alt={L.title}
            className="h-[320px] w-full object-cover md:h-[512px]"
          />
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <span className="rounded-full bg-neutral-950/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">12 Photos</span>
            {L.verification_status === "verified" && (
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800">
                <BadgeCheck size={13} className="text-lime-600" /> Verified Listing
              </span>
            )}
          </div>
        </div>
        <div className="hidden flex-col gap-2 lg:flex">
          {[1, 2].map((k) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={k}
              src={`/images/property-${((L.image_seed + k - 1) % 12) + 1}.svg`}
              alt=""
              className="h-[165px] w-full rounded-xl object-cover"
            />
          ))}
          <div className="relative h-[165px] overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/property-${((L.image_seed + 2) % 12) + 1}.svg`} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-neutral-950/50 text-lg font-semibold text-white">2+</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_372px]">
        <div>
          <div className="caption flex items-center gap-2 text-neutral-400">
            <span>• {L.purpose === "rent" ? "For Rent" : "For Sale"}</span>
            <VerificationBadge status={L.verification_status} />
          </div>
          <h2 className="mt-1.5 text-[26px] font-bold leading-9 text-brand-500">{naira(L.price)}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
            {L.land_size_sqm && <Pill>{L.land_size_sqm} sqm • {TYPE_LABEL[L.property_type]}</Pill>}
            {L.bedrooms && (
              <Pill>
                {L.bedrooms} Beds • {L.bathrooms} Baths{!L.land_size_sqm ? ` • ${TYPE_LABEL[L.property_type]}` : ""}
              </Pill>
            )}
            {!L.land_size_sqm && !L.bedrooms && <Pill>{TYPE_LABEL[L.property_type]}</Pill>}
          </div>

          <h2 className="h4 mt-8 text-neutral-900">Overview</h2>
          <p className="body-md mt-2 max-w-[560px] text-neutral-500">{L.description}</p>

          <dl className="mt-8 max-w-[560px]">
            {[
              ["Property Type", TYPE_LABEL[L.property_type]],
              L.land_size_sqm ? ["Land Size", `${L.land_size_sqm} sqm`] : null,
              L.bedrooms ? ["Bedrooms", `${L.bedrooms} Bedrooms`] : null,
              L.bathrooms ? ["Bathrooms", `${L.bathrooms} Bathrooms`] : null,
              L.toilets ? ["Toilets", `${L.toilets} Toilets`] : null,
              ["Infrastructure", amenities.join(", ") || "—"],
              ["Road Access", "Accessible via paved road network with direct connection to major routes"],
              ["Electricity Access", "Connected to nearby electricity infrastructure with ongoing estate power development."],
              ["Water Supply", "Borehole water access available within the estate."],
              ["Security", "Gated environment with controlled access and on-site security personnel."],
            ]
              .filter(Boolean)
              .map((row) => {
                const [k, v] = row as [string, string];
                return (
                  <div key={k} className="grid grid-cols-[150px_1fr] gap-6 py-3 text-sm">
                    <dt className="text-neutral-400">{k}</dt>
                    <dd className="text-right text-neutral-700">{v}</dd>
                  </div>
                );
              })}
          </dl>

          <h2 className="h4 mt-8 text-neutral-900">Verification Documents</h2>
          <div className="mt-3 max-w-[560px] space-y-2">
            {data.documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-neutral-100 bg-white px-5 py-3.5">
                <span className="text-sm text-neutral-700">{d.doc_type}</span>
                <VerificationBadge status={d.status === "approved" ? "verified" : d.status === "under_review" ? "under_review" : "unverified"} />
              </div>
            ))}
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="text-base font-semibold text-neutral-900">Schedule an Inspection</h3>
            <p className="body-r mt-1 text-neutral-400">Get a tour of the property as per your time</p>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="date"
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="h-10 min-w-0 flex-1 rounded-xl bg-neutral-100 px-3 text-xs outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <span className="text-xs text-neutral-400">at</span>
              <input
                type="time"
                value={quickTime}
                onChange={(e) => setQuickTime(e.target.value)}
                className="h-10 min-w-0 flex-1 rounded-xl bg-neutral-100 px-3 text-xs outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
            <button
              onClick={() => setBook(true)}
              className="btn-text mt-4 h-11 w-full rounded-xl bg-support-blue text-white transition hover:brightness-110"
            >
              Book Inspection
            </button>
            <button
              onClick={() => setInqOpen(true)}
              className="btn-text mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 text-neutral-800 transition hover:bg-neutral-50"
            >
              <MessageSquare size={15} /> Message Consultant
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="text-base font-semibold text-neutral-900">Agent Information</h3>
            <p className="body-r mt-1 text-neutral-400">Get an insight of the property from the agent</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: L.owner_color ?? "#040315" }}>
                {(L.owner_name ?? "EA").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                  {L.owner_name ?? "E-Access Developer"} <BadgeCheck size={14} className="text-lime-600" />
                </div>
                <p className="text-xs text-neutral-400">Verified property developer on E-Access.</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setInqOpen(true)} className="h-10 rounded-xl bg-[#e9c46a] text-sm font-semibold text-[#3a2d0d] transition hover:brightness-105">
                Contact now
              </button>
              <Link
                href={L.owner_id ? `/dashboard/developer/${L.owner_id}` : "/dashboard"}
                className="flex h-10 items-center justify-center rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                View Listings
              </Link>
            </div>
          </div>

          <MortgageCalculator price={L.price} />

          {inqOpen && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              {inqSent ? (
                <p className="body-md text-lime-600">Message sent — the consultant will reply in Messages.</p>
              ) : (
                <>
                  <textarea
                    value={inqMsg}
                    onChange={(e) => setInqMsg(e.target.value)}
                    rows={3}
                    placeholder={`Ask about ${L.title}…`}
                    className="w-full rounded-xl bg-neutral-100 p-3.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                  <button onClick={sendInquiry} className="btn-text mt-2 h-10 w-full rounded-xl bg-brand-900 text-white hover:bg-brand-500">
                    Send Inquiry
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Similar */}
      {data.similar.length > 0 && (
        <div className="mt-12">
          <h2 className="label-lg text-neutral-900">Similar Verified Properties</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.similar.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}

      <BookInspectionDrawer
        listingId={L.id}
        listingTitle={L.title}
        listingLocation={`${L.location_area}, ${L.location_city}`}
        initialDate={quickDate}
        initialTime={quickTime}
        open={book}
        onClose={() => setBook(false)}
      />
    </div>
  );
}
