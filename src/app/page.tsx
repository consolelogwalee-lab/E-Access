import { FileCheck2, ShieldCheck, MapPinCheckInside, Lock } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { LandingBrowse } from "@/components/landing/LandingBrowse";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Featured } from "@/components/landing/Featured";
import { Reveal } from "@/components/landing/Reveal";
import { LogoFull } from "@/components/Logo";
import { q } from "@/lib/db";
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

type Post = {
  id: number; title: string; category: string; video_url: string | null;
  cover_image: string | null; created_at: string;
};

const PILLARS = [
  {
    kicker: "01 · Buy & Sell",
    title: "Verified Property Marketplace",
    body: "Browse land, apartments, duplexes and commercial property that has already passed document and developer checks. Save, compare, make offers and book inspections.",
    image: "/photos/estate-street.jpg",
    cta: "Browse listings",
    href: "/#browse",
  },
  {
    kicker: "02 · Protect Your Property",
    title: "Property & Document Validation",
    body: "Already own property, or about to pay for one? Upload the documents and our team, with legal partners, verifies the title and stamps it. No more buying wahala.",
    image: "/photos/duplex-8.jpg",
    cta: "Verify a property",
    href: "/dashboard/validate",
  },
  {
    kicker: "03 · Stay Ahead",
    title: "News, Reels & Market Insights",
    body: "Real estate news, videos, offers and opportunities from T-Prime and around the world, so every decision you make is an informed one.",
    image: "/photos/apartment-6.jpg",
    cta: "Open the Info Center",
    href: "/news",
  },
];

export default async function Home() {
  const browseListings = (await q(
    "SELECT * FROM listings WHERE status='active' ORDER BY verification_status = 'verified' DESC, created_at DESC LIMIT 100"
  )) as unknown as Listing[];
  const featured = (await q(
    "SELECT * FROM listings WHERE status='active' ORDER BY featured DESC, saves DESC LIMIT 7"
  )) as unknown as (Listing & { estate_name: string | null })[];
  const reels = (await q(
    "SELECT id, title, category, video_url, cover_image, created_at FROM posts WHERE published = 1 ORDER BY video_url IS NULL, created_at DESC LIMIT 8"
  )) as unknown as Post[];

  return (
    <main className="bg-white">
      <Navbar />

      {/* ============ HERO: three panels, slanted dividers ============ */}
      <section className="relative h-[440px] overflow-hidden bg-neutral-950 md:h-[540px]">
        {/* Three slanted photo panels: estate land, trusted homes, verified interiors */}
        {[
          { src: "/photos/hero-1.jpg", alt: "Verified estate land", clip: "polygon(0 0, 36% 0, 30% 100%, 0 100%)", delay: "0s" },
          { src: "/photos/hero-2.jpg", alt: "Open estate land ready for development", clip: "polygon(36% 0, 69% 0, 63% 100%, 30% 100%)", delay: "-5s" },
          { src: "/photos/hero-3.jpg", alt: "Move-in ready interiors", clip: "polygon(69% 0, 100% 0, 100% 100%, 63% 100%)", delay: "-11s" },
        ].map((p) => (
          <div key={p.src} className="absolute inset-0" style={{ clipPath: p.clip }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.src}
              alt={p.alt}
              className="kenburns h-full w-full object-cover"
              style={{ animationDelay: p.delay }}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/60" />
        {/* Fine, fancy divider lines tracing the panel seams */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="hero-divider" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="35%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="62%" stopColor="#f0d488" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <g className="divider-glow">
            <line x1="36" y1="0" x2="30" y2="100" stroke="url(#hero-divider)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            <line x1="69" y1="0" x2="63" y2="100" stroke="url(#hero-divider)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
        <div className="absolute inset-x-0 bottom-0 pb-10">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-6 md:flex-row md:items-end md:justify-between lg:px-8">
            <h1 className="headline-grotesk max-w-[720px] text-[38px] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] md:text-[56px]">
              Real Land, Real Owners
              <br />
              Real Peace of Mind
            </h1>
            <p className="body-lg max-w-[360px] font-semibold text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)] md:pb-2 md:text-right">
              Verified estates from trusted developers. Documents validated,
              inspections supported, every transaction secured.
            </p>
          </div>
        </div>
      </section>

      {/* ============ TRUSTED BY (marquee) ============ */}
      <section className="border-b border-neutral-100 py-9">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-6 px-6 md:flex-row md:gap-10 lg:px-20">
          <p className="w-full shrink-0 text-center text-[15px] font-semibold text-neutral-700 md:w-[240px] md:text-left">
            Trusted by 1,000+ realtors, developers and agents in Nigeria
          </p>
          <div className="marquee-mask min-w-0 flex-1 overflow-hidden">
            <div className="marquee-track flex w-max items-center gap-14 pr-14">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex items-center gap-14" aria-hidden={dup === 1}>
                  <span className="whitespace-nowrap font-serif text-[19px] font-semibold tracking-tight text-neutral-400">Eko Prime Realty</span>
                  <span className="whitespace-nowrap text-[17px] font-extrabold uppercase tracking-[0.2em] text-neutral-400">GIDIHOMES</span>
                  <span className="whitespace-nowrap text-[19px] font-bold italic text-neutral-400">Lekki Shore Estates</span>
                  <span className="whitespace-nowrap font-serif text-[18px] tracking-wide text-neutral-400">Crown &amp; Acres</span>
                  <span className="whitespace-nowrap text-[17px] font-black uppercase text-neutral-400">BLUEROOF</span>
                  <span className="whitespace-nowrap text-[19px] font-semibold tracking-tight text-neutral-400">PalmField Realty</span>
                  <span className="whitespace-nowrap font-serif text-[18px] font-semibold italic text-neutral-400">Abuja Crest</span>
                  <span className="whitespace-nowrap text-[17px] font-extrabold tracking-[0.14em] text-neutral-400">ZARIA HEIGHTS</span>
                  <span className="whitespace-nowrap text-[19px] font-bold tracking-tight text-neutral-500">T-Prime Development</span>
                  <span className="whitespace-nowrap font-serif text-[19px] font-semibold text-neutral-400">Pearl Haven</span>
                  <span className="whitespace-nowrap text-[18px] font-extrabold uppercase tracking-[0.1em] text-neutral-400">Triconna Real Estate</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ THREE PILLARS ============ */}
      <section className="mx-auto max-w-[1280px] px-6 py-16 lg:px-20">
        <Reveal>
          <span className="text-sm font-extrabold uppercase tracking-[0.25em] text-[#E2A600]">One Platform</span>
          <h2 className="display mt-3 max-w-[560px] text-[30px] leading-[1.2] text-neutral-950 md:text-[40px]">
            Three Ways E-Access Works For You
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 120} className="h-full">
              <a href={p.href} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white transition duration-300 hover:-translate-y-1.5 hover:border-[#E2A600]/50 hover:shadow-2xl hover:shadow-neutral-900/10">
                <div className="relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="aspect-[400/230] w-full object-cover transition duration-500 group-hover:scale-[1.05]" />
                  <span className="absolute left-4 top-4 rounded-full bg-[#1B1F4E]/70 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#E2A600] shadow-md shadow-black/20 backdrop-blur">
                    {p.kicker}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-[19px] font-semibold leading-6 text-neutral-900">{p.title}</h3>
                  <p className="body-md mt-2.5 flex-1 text-neutral-500">{p.body}</p>
                  <span className="btn-text mt-5 inline-flex items-center gap-1.5 text-neutral-900 transition group-hover:gap-3">
                    {p.cta} <span aria-hidden>→</span>
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ DIVIDER ============ */}
      <div className="relative mx-auto max-w-[1280px] px-6 pb-10 pt-2 lg:px-20" aria-hidden="true">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
        <div className="absolute left-1/2 top-2 h-[3px] w-28 -translate-x-1/2 -translate-y-[1px] rounded-full bg-gradient-to-r from-[#1B1F4E] via-[#E2A600] to-[#1B1F4E] shadow-[0_0_14px_rgba(226,166,0,0.45)]" />
      </div>

      {/* ============ BROWSE ============ */}
      <LandingBrowse listings={browseListings} />

      {/* ============ CONCIERGE CTA ============ */}
      <section className="mx-auto max-w-[1280px] px-6 pb-4 lg:px-20">
        <Reveal>
          <div className="flex flex-wrap items-center gap-6 rounded-3xl border border-neutral-200 bg-neutral-50 p-8 md:p-10">
            <div className="min-w-0 flex-1">
              <h2 className="display text-[24px] leading-8 text-neutral-950 md:text-[30px]">
                Can&apos;t find what you&apos;re looking for?
              </h2>
              <p className="body-md mt-2 max-w-[520px] text-neutral-500">
                Tell us exactly what you want: type, budget, location. Our team and network of verified
                agents will hunt it down and bring you options, all verified first.
              </p>
            </div>
            <a href="/dashboard/request" className="btn-gold flex h-12 items-center rounded-xl px-7 text-[14px]">
              Request a property
            </a>
          </div>
        </Reveal>
      </section>

      {/* ============ WHY US ============ */}
      <section id="why-us" className="bg-[#04040a] text-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-20">
          <div className="grid gap-8 lg:grid-cols-2">
            <Reveal>
              <span className="text-lg font-extrabold uppercase tracking-[0.25em] text-[#E2A600]">
                Why Us
              </span>
              <h2 className="display mt-4 max-w-[480px] text-[34px] leading-[1.2] text-white md:text-[44px]">
                Every Listing Goes Through Verification
              </h2>
            </Reveal>
            <Reveal delay={120} className="lg:justify-self-end">
              <p className="body-md max-w-[470px] pt-8 text-white/60">
                Access properties backed by document verification, developer credibility
                checks, due diligence support, and professional inspection services,
                helping you make more informed and secure real estate decisions.
              </p>
            </Reveal>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[506px_1fr]">
            <Reveal className="h-full">
              <div className="h-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/photos/whyus.jpg"
                  alt="Verified premium home"
                  className="h-full min-h-[320px] w-full object-cover transition duration-500 hover:scale-[1.03]"
                />
              </div>
            </Reveal>
            <div className="grid gap-3 sm:grid-cols-2">
              {WHYS.map((w, i) => (
                <Reveal key={w.title} delay={i * 110}>
                  <div className="group h-full rounded-2xl border border-white/10 bg-white/5 p-6 transition duration-300 hover:-translate-y-1 hover:border-[#E2A600]/40 hover:bg-white/[0.08]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition duration-300 group-hover:scale-110">
                      <w.icon size={19} className="text-[#E2A600]" />
                    </span>
                    <h3 className="mt-14 text-base font-semibold text-white">{w.title}</h3>
                    <ul className="mt-3 space-y-1.5">
                      {w.points.map((p) => (
                        <li key={p} className="flex items-center gap-2 text-sm text-white/50">
                          <span className="h-1 w-1 rounded-full bg-[#E2A600]/60" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Reveal>
        <HowItWorks />
      </Reveal>

      {/* ============ REELS & INSIGHTS ============ */}
      {reels.length > 0 && (
        <section id="reels" className="mx-auto max-w-[1280px] px-6 pb-20 lg:px-20">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="text-sm font-extrabold uppercase tracking-[0.25em] text-[#E2A600]">Reels & Insights</span>
                <h2 className="display mt-3 max-w-[520px] text-[30px] leading-[1.2] text-neutral-950 md:text-[38px]">
                  Real Estate, Explained
                </h2>
              </div>
              <a href="/news" className="btn-text flex items-center gap-1.5 rounded-full border border-neutral-200 px-5 py-2.5 text-neutral-800 transition hover:border-neutral-400">
                View all <span aria-hidden>→</span>
              </a>
            </div>
          </Reveal>
          <div className="scroll-thin mt-7 flex gap-4 overflow-x-auto pb-3">
            {reels.map((r) => (
              <a
                key={r.id}
                href={`/news/${r.id}`}
                className="group relative h-[340px] w-[220px] shrink-0 overflow-hidden rounded-3xl bg-neutral-950"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/photos/${r.cover_image ?? "estate-street.jpg"}`}
                  alt=""
                  className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.06] group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />
                {r.video_url && (
                  <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur transition group-hover:scale-110 group-hover:bg-[#E2A600]/90">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur">
                  {r.category === "news" ? "News" : r.category === "offer" ? "Offer" : r.category === "opportunity" ? "Opportunity" : "Update"}
                </span>
                <span className="absolute inset-x-3 bottom-3 line-clamp-3 text-[14px] font-semibold leading-5 text-white">
                  {r.title}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      <Reveal>
        <Featured listings={featured} />
      </Reveal>

      {/* ============ FOOTER ============ */}
      <footer className="relative overflow-hidden bg-[#04040a] text-white">
        <div className="relative h-[280px] md:h-[360px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/footer-aerial.jpg" alt="" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#04040a]/70 via-[#04040a]/30 to-[#04040a]" />
        </div>
        <div className="relative -mt-40 pb-10">
          <div className="mx-auto grid max-w-[1280px] gap-12 px-6 md:grid-cols-[1fr_auto_auto] md:gap-20 lg:px-12">
            <div className="flex flex-col justify-between gap-10">
              <LogoFull />
              <h2 className="display max-w-[420px] text-[28px] leading-[1.25] md:text-[36px]">
                Secure Property Discovery
                <br />
                Starts Here
              </h2>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#E2A600]">Pages</div>
              <ul className="mt-6 space-y-4 text-[15px]">
                {[
                  ["Home", "/"],
                  ["Why Us", "#why-us"],
                  ["How it Works", "#how-it-works"],
                  ["Featured Listings", "#featured"],
                  ["News & Info Center", "/news"],
                ].map(([l, h]) => (
                  <li key={l}>
                    <a href={h} className="text-white/75 transition hover:text-white">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#E2A600]">Contact / Legal</div>
              <ul className="mt-6 space-y-4 text-[15px]">
                <li><a href="#" className="text-white/75 transition hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-white/75 transition hover:text-white">Terms of Use</a></li>
                <li><a href="mailto:hello.eaccess@gmail.com" className="text-white/75 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-[#E2A600]">hello.eaccess@gmail.com</a></li>
                <li><a href="tel:+2340000001111" className="text-white/75 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-[#E2A600]">+234 000 000 1111</a></li>
              </ul>
            </div>
          </div>
          <div className="mx-auto mt-14 max-w-[1280px] px-6 lg:px-12">
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                {[
                  ["X", "M4 4l16 16M20 4L4 20"],
                  ["Instagram", "M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm5 5.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM17.2 6.6h.01"],
                  ["WhatsApp", "M12 3a9 9 0 00-7.8 13.5L3 21l4.7-1.2A9 9 0 1012 3zm-3 6c.3-.8.7-.8 1-.8h.8c.2 0 .5.1.6.5l.7 1.7c.1.3 0 .5-.2.7l-.5.6c-.1.2-.2.4 0 .7.7 1.2 1.6 2 2.9 2.6.3.1.5.1.7-.1l.7-.8c.2-.2.4-.3.7-.2l1.8.9c.3.1.4.4.4.6-.1 1-.9 1.9-1.9 1.9-2.2.2-4.5-1.1-6.1-2.9C9.1 13.7 8.4 11.2 9 9z"],
                  ["YouTube", "M22 12s0-3.3-.4-4.8a2.5 2.5 0 00-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 002.4 7.2C2 8.7 2 12 2 12s0 3.3.4 4.8a2.5 2.5 0 001.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.4a2.5 2.5 0 001.8-1.8C22 15.3 22 12 22 12zm-12 3V9l5.2 3L10 15z"],
                ].map(([label, d]) => (
                  <a
                    key={label}
                    href={
                      label === "Instagram" ? "https://www.instagram.com/tprime.dev/"
                      : label === "YouTube" ? "https://youtube.com/@tprimedevelopment"
                      : "#"
                    }
                    target={label === "Instagram" || label === "YouTube" ? "_blank" : undefined}
                    rel={label === "Instagram" || label === "YouTube" ? "noreferrer" : undefined}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-white/40 hover:text-white"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={label === "X" ? "none" : "currentColor"} stroke={label === "X" ? "currentColor" : "none"} strokeWidth="2.2" strokeLinecap="round">
                      <path d={d} fill={label === "Instagram" ? "none" : undefined} stroke={label === "Instagram" ? "currentColor" : undefined} strokeWidth={label === "Instagram" ? 2 : undefined} />
                    </svg>
                  </a>
                ))}
              </div>
              <div className="text-xs text-white/45">
                Built for T-Prime Development, Port Harcourt • Land. Property. Possibilities.
              </div>
              <div className="text-xs text-white/45">© 2026 E-Access. All rights reserved.</div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
