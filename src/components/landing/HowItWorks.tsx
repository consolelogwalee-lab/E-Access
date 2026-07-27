"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Search, BadgeCheck, Users, FolderLock } from "lucide-react";

const STEPS = [
  {
    title: "Discover",
    body: "Browse verified properties with filters tailored to your preferred location, budget range, and property type, making it easier to compare options that match your investment goals.",
    icon: Search,
  },
  {
    title: "Verify",
    body: "Review property details, verification status, developer credibility, and supporting documents before making any commitment or payment decision.",
    icon: BadgeCheck,
  },
  {
    title: "Consult & Inspect",
    body: "Request professional site inspections or receive guided remote support from verified consultants when you're unable to visit the property yourself.",
    icon: Users,
  },
  {
    title: "Secure",
    body: "Complete your purchase with confidence, securely store essential property documents, and track your portfolio from a dedicated ownership dashboard.",
    icon: FolderLock,
  },
];

export function HowItWorks() {
  const [step, setStep] = useState(0);
  const S = STEPS[step];
  return (
    <section id="how-it-works" className="mx-auto max-w-[1280px] px-6 py-16 lg:px-[116px]">
      <div className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photos/howitworks.jpg" alt="" className="h-[300px] w-full object-cover md:h-[440px]" />
        <div className="absolute inset-0 flex items-end justify-center pb-10">
          <div className="floaty flex w-[80%] max-w-[560px] items-center gap-3 rounded-full bg-white/90 px-5 py-3 shadow-lg backdrop-blur">
            <S.icon size={18} className="text-brand-500" />
            <span className="text-sm font-medium text-neutral-700">{S.title}</span>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <span className="body-lg text-neutral-900">How It Works</span>
        <div className="flex items-center gap-2 text-sm">
          {STEPS.map((s, i) => (
            <span key={s.title} className="flex items-center gap-2">
              {i > 0 && <span className="text-neutral-300">/</span>}
              <button
                onClick={() => setStep(i)}
                className={`transition ${i === step ? "font-semibold text-support-blue" : "text-neutral-400 hover:text-neutral-600"}`}
              >
                Step {i + 1}
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            aria-label="Previous step"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition enabled:hover:bg-neutral-100 disabled:opacity-30"
          >
            <ArrowLeft size={17} />
          </button>
          <button
            aria-label="Next step"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={step === STEPS.length - 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition enabled:hover:bg-neutral-100 disabled:opacity-30"
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <div key={step} className="fade-slide mx-auto mt-10 max-w-[560px]">
        <h3 className="text-[26px] font-semibold leading-9 text-neutral-900">{S.title}</h3>
        <p className="body-lg mt-3 text-neutral-500">{S.body}</p>
      </div>
    </section>
  );
}
