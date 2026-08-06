import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, BedDouble, Bath, MapPin, Ruler } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { LogoFull } from "@/components/Logo";
import { q1, q } from "@/lib/db";
import { naira } from "@/lib/format";
import { listingImage, poolImage } from "@/lib/images";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Full = {
  id: number; title: string; purpose: string; property_type: string; price: number;
  location_area: string; location_city: string; estate_name: string | null;
  bedrooms: number | null; bathrooms: number | null; land_size_sqm: number | null;
  description: string | null; verification_status: string; image_seed: number;
  amenities_json: string | null;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const l = (await q1("SELECT title, price, location_area, location_city FROM listings WHERE id = $1 AND status = 'active'", [Number(id)])) as { title: string; price: number; location_area: string; location_city: string } | null;
  if (!l) return { title: "E-Access" };
  return {
    title: `${l.title} | E-Access`,
    description: `${naira(Number(l.price))} • ${l.location_area}, ${l.location_city}. Verified property discovery on E-Access.`,
  };
}

export default async function PublicListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const L = (await q1("SELECT * FROM listings WHERE id = $1 AND status = 'active'", [Number(id)])) as Full | null;
  if (!L) notFound();
  const similar = (await q(
    "SELECT * FROM listings WHERE status = 'active' AND property_type = $1 AND id != $2 ORDER BY verification_status = 'verified' DESC LIMIT 3",
    [L.property_type, L.id]
  )) as unknown as Full[];
  const amenities: string[] = L.amenities_json ? JSON.parse(L.amenities_json) : [];
  const waText = encodeURIComponent(`Check out this property on E-Access: ${L.title} (${naira(Number(L.price))})`);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-[1120px] px-6 pb-20 pt-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {L.verification_status === "verified" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-50 px-3 py-1.5 text-xs font-semibold text-lime-700">
                <BadgeCheck size={13} /> Verified by E-Access
              </span>
            )}
            <h1 className="display mt-3 text-[30px] leading-[1.15] text-neutral-950 md:text-[40px]">{L.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
              <MapPin size={14} /> {L.location_area}, {L.location_city}
            </p>
          </div>
          <div className="text-[28px] font-bold text-brand-500">{naira(Number(L.price))}</div>
        </div>

        <div className="mt-6 grid gap-2 md:grid-cols-[1fr_240px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={listingImage(L)} alt={L.title} className="h-[300px] w-full rounded-2xl object-cover md:h-[440px]" />
          <div className="hidden flex-col gap-2 md:flex">
            {[1, 2].map((o) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={o} src={o === 1 ? listingImage(L, 1) : poolImage(L.image_seed, o)} alt="" className="h-[216px] w-full rounded-2xl object-cover" />
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {L.bedrooms ? <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3.5 py-2 text-sm text-neutral-700"><BedDouble size={14} /> {L.bedrooms} Bedrooms</span> : null}
          {L.bathrooms ? <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3.5 py-2 text-sm text-neutral-700"><Bath size={14} /> {L.bathrooms} Bathrooms</span> : null}
          {L.land_size_sqm ? <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3.5 py-2 text-sm text-neutral-700"><Ruler size={14} /> {L.land_size_sqm} sqm</span> : null}
          {amenities.map((a) => (
            <span key={a} className="rounded-full bg-neutral-100 px-3.5 py-2 text-sm text-neutral-700">{a}</span>
          ))}
        </div>

        {L.description && <p className="body-lg mt-6 max-w-[760px] text-neutral-600">{L.description}</p>}

        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl bg-[#04040a] p-6 text-white md:p-8">
          <div className="min-w-0 flex-1">
            <h2 className="display text-[22px]">Interested in this property?</h2>
            <p className="body-md mt-1 text-white/60">
              Sign in to book an inspection, message the developer, or make an offer. Verification and documents included.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/auth/login?next=/dashboard/property/${L.id}`} className="btn-text rounded-full bg-[#E2A600] px-6 py-3 text-[#3f3005] transition hover:brightness-105">
              Book Inspection
            </Link>
            <Link href={`/auth/login?next=/dashboard/property/${L.id}`} className="btn-text rounded-full border border-white/25 px-6 py-3 text-white transition hover:border-white/60">
              Message Agent
            </Link>
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noreferrer"
              className="btn-text rounded-full border border-white/25 px-6 py-3 text-white transition hover:border-white/60"
            >
              Share on WhatsApp
            </a>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-14">
            <h2 className="h3 text-neutral-900">Similar properties</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {similar.map((s) => (
                <Link key={s.id} href={`/listing/${s.id}`} className="group rounded-2xl border border-neutral-200 p-2 transition hover:shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={listingImage(s)} alt="" className="aspect-[292/190] w-full rounded-xl object-cover transition duration-300 group-hover:scale-[1.02]" />
                  <div className="px-2 pb-2 pt-3">
                    <div className="font-bold text-brand-500">{naira(Number(s.price))}</div>
                    <div className="body-md truncate text-neutral-600">{s.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <footer className="bg-[#04040a] py-10 text-center">
        <div className="flex justify-center"><LogoFull /></div>
        <p className="mt-4 text-xs text-white/40">© 2026 E-Access. All rights reserved.</p>
      </footer>
    </main>
  );
}
