import Link from "next/link";
import { FileCheck2, ShieldCheck, MapPinCheckInside, Lock } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSearch } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Featured } from "@/components/landing/Featured";
import { LogoFull } from "@/components/Logo";
import { q } from "@/lib/db";
import { naira } from "@/lib/format";
import type { Listing } from "@/components/ListingCard";

export const dynamic = "force-dynamic";

const WHYS = [
  {
    icon: FileCheck2,
    title: "Verification Badge System",
    points: ["Verified", "Inspection Available", "Documents Approved"],
  },
  {
    icon: ShieldCheck,
    title: "Trusted Developers",
    points: ["Credibility review", "Verified identities", "Reputation screening"],
  },
  {
    icon: MapPinCheckInside,
    title: "Professional Site Inspection",
    points: ["Physical inspection support", "Consultant representation"],
  },
  {
    icon: Lock,
    title: "Secure Transactions",
    points: ["Due diligence support", "Fraud prevention measures"],
  },
];

export default async function Home() {
  const heroListings = (await q(
    "SELECT * FROM listings WHERE status='active' AND verification_status='verified' ORDER BY id LIMIT 3"
  )) as unknown as Listing[];
  const featured = (await q(
    "SELECT * FROM listings WHERE status='active' ORDER BY featured DESC, saves DESC LIMIT 7"
  )) as unknown as (Listing & { estate_name: string | null })[];

  return (
    <main className="bg-white">
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="mx-auto max-w-[1280px] px-6 pb-4 pt-24 lg:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
          <h1 className="display text-[40px] leading-[1.15] text-neutral-900 md:text-[54px]">
            <span className="font-normal text-neutral-400">Real</span> Land{" "}
            <span className="font-normal text-neutral-400">Real</span> Owners
            <br />
            <span className="font-normal text-neutral-400">Real</span> Peace of Mind
          </h1>
          <p className="body-lg pt-3 text-neutral-500">
            Access verified estates from trusted developers, complete with document
            validation, inspection support, and secure transaction guidance all in
            one platform.
          </p>
        </div>

        <div className="mt-10">
          <HeroSearch />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {heroListings.map((l) => (
            <Link
              key={l.id}
              href={`/explore?focus=${l.id}`}
              className="group relative overflow-hidden rounded-2xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/property-${l.image_seed}.svg`}
                alt={l.title}
                className="aspect-[413/414] w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-md">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-neutral-900">
                    {(l as Listing & { estate_name: string | null }).estate_name ?? l.title}
                  </div>
                  <div className="truncate text-xs text-neutral-500">
                    {l.location_area}, {l.location_city}
                  </div>
                </div>
                <div className="shrink-0 pl-3 text-sm font-bold text-neutral-900">{naira(l.price)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ WHY US ============ */}
      <section id="why-us" className="mx-auto max-w-[1280px] px-6 py-20 lg:px-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <span className="body-md text-neutral-500">Why Us</span>
            <h2 className="display mt-4 max-w-[480px] text-[34px] leading-[1.2] text-neutral-950 md:text-[44px]">
              Every Listing Goes Through Verification
            </h2>
          </div>
          <p className="body-md max-w-[470px] pt-8 text-neutral-500 lg:justify-self-end">
            Access properties backed by document verification, developer credibility
            checks, due diligence support, and professional inspection services —
            helping you make more informed and secure real estate decisions.
          </p>
        </div>

        <div className="mt-10 grid items-end gap-10 lg:grid-cols-[506px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/house-3d.svg" alt="Verified modern home" className="w-full max-w-[506px] rounded-2xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            {WHYS.map((w) => (
              <div key={w.title} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                  <w.icon size={19} className="text-brand-500" />
                </span>
                <h3 className="mt-14 text-base font-semibold text-neutral-900">{w.title}</h3>
                <ul className="mt-3 space-y-1.5">
                  {w.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-neutral-400">
                      <span className="h-1 w-1 rounded-full bg-neutral-300" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />

      <Featured listings={featured} />

      {/* ============ FOOTER ============ */}
      <footer className="relative overflow-hidden bg-black text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/city-aerial.svg" alt="" className="h-[300px] w-full object-cover md:h-[420px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
        <div className="relative -mt-24 bg-gradient-to-b from-transparent to-black pb-10">
          <div className="mx-auto grid max-w-[1280px] gap-10 px-6 md:grid-cols-[1fr_auto_auto] lg:px-12">
            <div className="flex flex-col justify-between gap-10">
              <LogoFull />
              <h2 className="display max-w-[400px] text-[28px] leading-[1.25] md:text-[34px]">
                Secure Property Discovery Starts Here
              </h2>
            </div>
            <div>
              <div className="caption text-white/45">Pages</div>
              <ul className="mt-5 space-y-4 text-[15px]">
                {[
                  ["Home", "/"],
                  ["Why Us", "#why-us"],
                  ["How it Works", "#how-it-works"],
                  ["Featured Listings", "#featured"],
                ].map(([l, h]) => (
                  <li key={l}>
                    <a href={h} className="text-white/85 transition hover:text-white">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="caption text-white/45">Contact/Legal</div>
              <ul className="mt-5 space-y-4 text-[15px]">
                <li><a href="#" className="text-white/85 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-white/85 hover:text-white">Terms of Use</a></li>
                <li><a href="mailto:hello.eaccess@gmail.com" className="text-white/85 underline underline-offset-4 hover:text-white">hello.eaccess@gmail.com</a></li>
                <li><a href="tel:+2340000001111" className="text-white/85 underline underline-offset-4 hover:text-white">call us ( +234 000 000 1111 )</a></li>
              </ul>
            </div>
          </div>
          <div className="mx-auto mt-10 max-w-[1280px] px-6 text-right text-xs text-white/45 lg:px-12">
            © 2026 E-Access. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
