"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Heart, MapPin, BadgeCheck, MessageSquare, Headset, X } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { ListingCard, type Listing } from "@/components/ListingCard";
import { VerificationBadge, Pill } from "@/components/Badges";
import { BookInspectionDrawer } from "@/components/dashboard/BookInspection";
import { MortgageCalculator } from "@/components/dashboard/MortgageCalculator";
import { PhotoGallery } from "@/components/PhotoGallery";
import { openConsultation } from "@/components/ConsultationHost";
import { naira, TYPE_LABEL } from "@/lib/format";
import { listingImage, poolImage } from "@/lib/images";
import { trackRecent } from "@/lib/compare";

type Doc = { id: number; doc_type: string; file_name: string; status: string };
type Full = Listing & {
  description: string | null; amenities_json: string | null; views: number;
  purpose: string; toilets: number | null; estate_name: string | null;
  owner_id: number | null; owner_name: string | null; owner_color: string | null;
};

export default function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ listing: Full; documents: Doc[]; media?: { url: string }[]; similar: Listing[]; saved: boolean } | null>(null);
  const [book, setBook] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inqOpen, setInqOpen] = useState(false);
  const [quickDate, setQuickDate] = useState("");
  const [quickTime, setQuickTime] = useState("");
  const [inqMsg, setInqMsg] = useState("");
  const [inqSent, setInqSent] = useState(false);
  const [inqErr, setInqErr] = useState("");
  const [inqThreadId, setInqThreadId] = useState<number | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const [offerState, setOfferState] = useState<"" | "sent" | string>("");
  const [shared, setShared] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setSaved(!!d.saved); });
    trackRecent(Number(id));
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
  // Real uploaded media when it exists; otherwise deterministic stand-ins.
  // Either way the count shown is the count you can actually open.
  const photos: string[] = data.media?.length
    ? data.media.map((m) => m.url)
    : [listingImage(L), listingImage(L, 1), listingImage(L, 2), poolImage(L.image_seed, 3), poolImage(L.image_seed, 4)];

  async function toggleSave() {
    setSaved((s) => !s);
    await fetch(`/api/listings/${L.id}/save`, { method: "POST" });
  }

  async function sendInquiry() {
    if (!inqMsg.trim()) { setInqErr("Write a short message first."); return; }
    setInqErr("");
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: L.id, message: inqMsg }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setInqErr(d?.error ?? "Could not send that. Try again."); return; }
    if (d?.threadId) setInqThreadId(Number(d.threadId));
    setInqSent(true);
  }

  async function submitOffer() {
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: L.id, amount: Number(offerAmount), message: offerMsg }),
    });
    const d = await res.json();
    if (!res.ok) { setOfferState(d.error ?? "Could not send the offer."); return; }
    setOfferState("sent");
  }

  async function share() {
    const url = `${window.location.origin}/listing/${L.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: L.title, url });
        return;
      }
    } catch { /* fall through to clipboard */ }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch { window.open(url, "_blank"); }
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
          <button
            onClick={share}
            className="flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Share2 size={14} /> {shared ? "Link copied!" : "Share"}
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
      <PhotoGallery photos={photos} alt={L.title} verified={L.verification_status === "verified"} />

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
              <MessageSquare size={15} /> Message Agent
            </button>
            {L.purpose !== "rent" && (
              <button
                onClick={() => setOfferOpen(true)}
                className="btn-text mt-2 h-11 w-full rounded-xl bg-[#E2A600] text-[#3f3005] transition hover:brightness-105"
              >
                Make an Offer
              </button>
            )}
            <button
              onClick={() => openConsultation({
                id: L.id, title: L.title, price: L.price, image: photos[0],
                area: L.location_area, city: L.location_city,
              })}
              className="btn-text mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 text-neutral-800 transition hover:bg-neutral-50"
            >
              <Headset size={15} /> Speak to a Consultant
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
        </div>
      </div>

      {/* Ask the agent: a sheet on mobile, a modal on desktop, so it always
          opens where you are rather than far below the fold. */}
      {inqOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[2px]" onClick={() => setInqOpen(false)} />
          <div className="pop-up relative max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl scroll-thin sm:max-w-[440px] sm:rounded-2xl sm:pb-5">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-200 sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-neutral-900">Message the agent</h3>
              <button onClick={() => setInqOpen(false)} aria-label="Close" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100">
                <X size={17} />
              </button>
            </div>

            {/* Property context, so the agent always knows what this is about */}
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-neutral-50 p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[0]} alt="" className="h-12 w-14 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-neutral-900">{L.title}</div>
                <div className="truncate text-xs text-neutral-400">{naira(L.price)} • {L.location_area}, {L.location_city}</div>
              </div>
            </div>

            {inqSent ? (
              <div className="mt-4">
                <p className="body-md text-lime-600">Message sent. Continue the conversation in Messages.</p>
                <Link
                  href={inqThreadId ? `/dashboard/messages?thread=${inqThreadId}` : "/dashboard/messages"}
                  className="btn-text mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-brand-900 text-white transition hover:bg-brand-500"
                >
                  Open Messages
                </Link>
              </div>
            ) : (
              <>
                <textarea
                  value={inqMsg}
                  onChange={(e) => setInqMsg(e.target.value)}
                  rows={4}
                  autoFocus
                  placeholder={`Ask about ${L.title}…`}
                  className="mt-3 w-full rounded-xl bg-neutral-100 p-3.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Is this still available?", "Can I schedule an inspection?", "Are the documents verified?"].map((qq) => (
                    <button key={qq} onClick={() => setInqMsg(qq)} className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-400">
                      {qq}
                    </button>
                  ))}
                </div>
                {inqErr && <p className="mt-2 text-xs text-red-600">{inqErr}</p>}
                <button onClick={sendInquiry} className="btn-text mt-3 h-11 w-full rounded-xl bg-brand-900 text-white transition hover:bg-brand-500">
                  Send message
                </button>
              </>
            )}
          </div>
        </div>
      )}

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

      {offerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-[2px]" onClick={() => setOfferOpen(false)}>
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {offerState === "sent" ? (
              <div className="py-4 text-center">
                <p className="h4 text-neutral-900">Offer sent</p>
                <p className="body-md mt-2 text-neutral-500">
                  The team will review your offer and you will get a notification once it is accepted or declined.
                </p>
                <button onClick={() => setOfferOpen(false)} className="btn-text mt-5 h-11 w-full rounded-xl bg-neutral-950 text-white">Done</button>
              </div>
            ) : (
              <>
                <h3 className="h4 text-neutral-900">Make an Offer</h3>
                <p className="body-md mt-1 text-neutral-500">Asking price is {naira(L.price)}. Enter what you are willing to pay.</p>
                <label className="mt-4 block text-xs font-semibold text-neutral-500">Your offer (₦)</label>
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                  placeholder="e.g. 42000000"
                />
                <label className="mt-4 block text-xs font-semibold text-neutral-500">Message (optional)</label>
                <textarea
                  value={offerMsg}
                  onChange={(e) => setOfferMsg(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                  placeholder="Any conditions, e.g. payment timeline"
                />
                {offerState && offerState !== "sent" && <p className="mt-2 text-sm text-red-600">{offerState}</p>}
                <div className="mt-5 flex gap-2">
                  <button onClick={() => setOfferOpen(false)} className="btn-text h-12 flex-1 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200">Cancel</button>
                  <button onClick={submitOffer} className="btn-text h-12 flex-1 rounded-xl bg-[#E2A600] text-[#3f3005] hover:brightness-105">Send offer</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
