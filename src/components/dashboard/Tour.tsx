"use client";
import { useEffect, useState } from "react";
import { BadgeCheck, BellRing, HandCoins, Heart, Newspaper, Scale, Search, Stamp, X } from "lucide-react";
import { LogoMark } from "@/components/Logo";

const KEY = "eaccess_tour_v1";
export const TOUR_EVENT = "eaccess-tour-open";

type Slide = {
  title: string;
  body: string;
  icons: { icon: React.ReactNode; label: string }[];
};

const SLIDES: Slide[] = [
  {
    title: "Welcome to E-Access",
    body: "The verified way to buy, sell and protect property in Nigeria. Here is a quick tour of the four things you can do here. It takes 30 seconds.",
    icons: [],
  },
  {
    title: "Discover verified property",
    body: "Browse land, homes and commercial property on Discover. The green Verified badge means our team has already checked the documents and the developer, so you shop with confidence.",
    icons: [
      { icon: <Search size={20} className="text-[#1B1F4E]" />, label: "Filter & search" },
      { icon: <BadgeCheck size={20} className="text-lime-600" />, label: "Verified badge" },
    ],
  },
  {
    title: "Save, compare, make your move",
    body: "Tap the heart to save a listing, use Compare to line up to three properties side by side, then make an offer right from the property page. When it is accepted, a transaction tracker guides every stage to key handover.",
    icons: [
      { icon: <Heart size={20} className="text-red-500" />, label: "Save" },
      { icon: <Scale size={20} className="text-[#1B1F4E]" />, label: "Compare" },
      { icon: <HandCoins size={20} className="text-[#E2A600]" />, label: "Offer" },
    ],
  },
  {
    title: "Verify your own property",
    body: "Already own land or about to pay for one? Open Verify Property, upload the documents and photos, and our team with legal partners checks the title at the registry. If it holds, you get a stamped Certificate of Verification.",
    icons: [
      { icon: <Stamp size={20} className="text-[#E2A600]" />, label: "Approved & stamped" },
    ],
  },
  {
    title: "Stay ahead",
    body: "Save a search and we alert you the moment a matching property lands. Follow the News & Info Center for market news, offers and videos, and reach verified agents directly on WhatsApp.",
    icons: [
      { icon: <BellRing size={20} className="text-[#E2A600]" />, label: "Alerts" },
      { icon: <Newspaper size={20} className="text-[#1B1F4E]" />, label: "News & reels" },
    ],
  },
];

export function Tour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) {
      const t = setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const onOpen = () => { setStep(0); setOpen(true); };
    window.addEventListener(TOUR_EVENT, onOpen);
    return () => window.removeEventListener(TOUR_EVENT, onOpen);
  }, []);

  function close() {
    localStorage.setItem(KEY, "done");
    setOpen(false);
    setStep(0);
  }

  if (!open) return null;
  const s = SLIDES[step];
  const last = step === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-neutral-950/60 p-4 backdrop-blur-[3px]">
      <div className="fade-slide w-full max-w-[460px] overflow-hidden rounded-3xl bg-white shadow-2xl" key={step}>
        {/* header visual */}
        <div className="relative flex h-[150px] items-center justify-center overflow-hidden bg-[#04040a]">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#1B1F4E]/60 blur-2xl" />
          <div className="absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-[#E2A600]/20 blur-2xl" />
          {step === 0 ? (
            <span className="floaty"><LogoMark size={72} /></span>
          ) : (
            <div className="flex items-center gap-4">
              {s.icons.map((it, i) => (
                <div key={it.label} className="floaty flex flex-col items-center gap-2" style={{ animationDelay: `${-i * 1.4}s` }}>
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/95 shadow-xl">
                    {it.icon}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">{it.label}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={close} aria-label="Skip tour" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div className="p-7">
          <h2 className="text-[21px] font-extrabold tracking-[-0.02em] text-neutral-900">{s.title}</h2>
          <p className="body-md mt-2.5 min-h-[88px] text-neutral-500">{s.body}</p>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`Step ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-[#E2A600]" : "w-1.5 bg-neutral-200 hover:bg-neutral-300"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="btn-text h-10 rounded-full px-4 text-neutral-500 transition hover:bg-neutral-100">
                  Back
                </button>
              )}
              {!last ? (
                <button onClick={() => setStep(step + 1)} className="btn-text h-10 rounded-full bg-neutral-950 px-5 text-white transition hover:bg-neutral-800">
                  Next
                </button>
              ) : (
                <button onClick={close} className="btn-gold h-10 rounded-full px-5 text-[13px]">
                  Start exploring
                </button>
              )}
            </div>
          </div>
          {step === 0 && (
            <button onClick={close} className="mt-3 w-full text-center text-xs text-neutral-400 transition hover:text-neutral-600">
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
