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

export default async function Home() {
  const browseListings = (await q(
    "SELECT * FROM listings WHERE status='active' ORDER BY verification_status = 'verified' DESC, created_at DESC LIMIT 100"
  )) as unknown as Listing[];
  const featured = (await q(
    "SELECT * FROM listings WHERE status='active' ORDER BY featured DESC, saves DESC LIMIT 7"
  )) as unknown as (Listing & { estate_name: string | null })[];

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

      {/* ============ BROWSE ============ */}
      <LandingBrowse listings={browseListings} />

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
                    href="#"
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
                Built for T-Prime Development • RC 000000
              </div>
              <div className="text-xs text-white/45">© 2026 E-Access. All rights reserved.</div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
