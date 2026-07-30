import Link from "next/link";
import { ArrowRight, BadgeCheck, FileCheck2, KeyRound } from "lucide-react";
import { LogoMark, LogoHero } from "@/components/Logo";

function AuthShowcase() {
  return (
    <div className="relative hidden flex-1 overflow-hidden bg-[#04040a] lg:block">
      {/* slow-drifting premium property photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/photos/duplex-8.jpg"
        alt=""
        className="kenburns absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#04040a] via-[#04040a]/35 to-[#04040a]/60" />

      {/* brand */}
      <div className="absolute left-10 top-10 hero-logo-in">
        <LogoHero size={44} />
      </div>

      {/* floating glass proof cards */}
      <div className="floaty absolute right-10 top-[26%] w-[240px] rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400/20">
            <BadgeCheck size={17} className="text-lime-300" />
          </span>
          <div>
            <div className="text-[13px] font-semibold text-white">Verified Listing</div>
            <div className="text-[11px] text-white/55">Documents checked &amp; approved</div>
          </div>
        </div>
      </div>
      <div className="floaty absolute left-10 top-[47%] w-[250px] rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md" style={{ animationDelay: "-2.2s" }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E2A600]/25">
            <FileCheck2 size={16} className="text-[#E2A600]" />
          </span>
          <div>
            <div className="text-[13px] font-semibold text-white">Title Verified</div>
            <div className="text-[11px] text-white/55">C of O confirmed at the registry</div>
          </div>
        </div>
      </div>
      <div className="floaty absolute right-14 top-[62%] w-[220px] rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md" style={{ animationDelay: "-3.8s" }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <KeyRound size={16} className="text-white" />
          </span>
          <div>
            <div className="text-[13px] font-semibold text-white">Keys Handed Over</div>
            <div className="text-[11px] text-white/55">Transaction completed safely</div>
          </div>
        </div>
      </div>

      {/* tagline */}
      <div className="absolute inset-x-10 bottom-12">
        <h2 className="display max-w-[420px] text-[30px] leading-[1.25] text-white">
          Own with certainty,
          <br />
          not with luck.
        </h2>
        <p className="body-md mt-3 max-w-[380px] text-white/55">
          Every listing verified. Every document checked. Land. Property. Possibilities.
        </p>
      </div>
    </div>
  );
}

export function AuthShell({
  children,
  footer = "Your information is securely protected and never shared without authorisation.",
  topRight = { text: "Already have an account?", cta: "Log in", href: "/auth/login" },
}: {
  children: React.ReactNode;
  footer?: string;
  topRight?: { text: string; cta: string; href: string } | null;
}) {
  return (
    <main className="flex min-h-screen bg-neutral-100">
      <AuthShowcase />
      <div className="flex min-h-screen w-full flex-col rounded-none bg-white p-6 shadow-2xl lg:m-2.5 lg:min-h-[calc(100vh-20px)] lg:w-[620px] lg:shrink-0 lg:rounded-2xl">
        <div className="flex items-center justify-between">
          <Link href="/"><LogoMark size={40} /></Link>
          {topRight && (
            <Link
              href={topRight.href}
              className="flex items-center gap-1.5 text-sm text-support-blue transition hover:underline"
            >
              {topRight.text} <span className="font-semibold">{topRight.cta}</span>
              <ArrowRight size={15} />
            </Link>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="mx-auto w-full max-w-[418px]">{children}</div>
        </div>
        <p className="pb-2 text-center text-xs text-neutral-400">{footer}</p>
      </div>
    </main>
  );
}

export function AuthHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-10 text-center">
      <h1 className="text-[24px] font-semibold leading-8 text-neutral-900">{title}</h1>
      <p className="body-md mx-auto mt-3 max-w-[400px] text-neutral-400">{sub}</p>
    </div>
  );
}

export function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="caption mb-1.5 block text-neutral-500">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export const inputCls =
  "h-12 w-full rounded-xl bg-neutral-100 px-4 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-brand-500/50";
