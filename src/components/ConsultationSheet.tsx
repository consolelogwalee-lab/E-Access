"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Check, Headset, HelpCircle, Home, KeyRound, Search, TrendingUp, X } from "lucide-react";
import { toast } from "@/components/Ui";

type Ctx = { id: number; title: string; price: number; image: string; area?: string; city?: string } | null;

const INTENTS = [
  { key: "buy", label: "Buy a property", icon: Home },
  { key: "rent", label: "Rent a property", icon: KeyRound },
  { key: "sell", label: "Sell a property", icon: Building2 },
  { key: "find", label: "Help me find a property", icon: Search },
  { key: "invest", label: "Property investment", icon: TrendingUp },
  { key: "question", label: "Ask a property question", icon: HelpCircle },
];

// Only ask what the intent actually needs. "question" asks almost nothing.
const ASKS: Record<string, { location?: boolean; type?: boolean; budget?: boolean; beds?: boolean; timeline?: boolean }> = {
  buy: { location: true, type: true, budget: true, beds: true, timeline: true },
  rent: { location: true, type: true, budget: true, beds: true, timeline: true },
  sell: { location: true, type: true, timeline: true },
  find: { location: true, type: true, budget: true, beds: true },
  invest: { location: true, budget: true, timeline: true },
  question: {},
};

const TYPES = ["Land", "Apartment", "Duplex", "Commercial"];
const TIMELINES = ["Immediately", "1-3 months", "3-6 months", "Just exploring"];
const QUICK: Record<string, string[]> = {
  question: ["Is this property still available?", "Can I schedule an inspection?", "Are the documents verified?", "Are there similar properties?"],
};

export function ConsultationSheet({
  open, onClose, context = null, prefill,
}: {
  open: boolean;
  onClose: () => void;
  context?: Ctx;
  prefill?: { locations?: string; propertyType?: string; budgetMin?: number; budgetMax?: number };
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [intent, setIntent] = useState("");
  const [locations, setLocations] = useState(prefill?.locations ?? "");
  const [propertyType, setPropertyType] = useState(prefill?.propertyType ?? "");
  const [budgetMin, setBudgetMin] = useState(prefill?.budgetMin ? String(prefill.budgetMin) : "");
  const [budgetMax, setBudgetMax] = useState(prefill?.budgetMax ? String(prefill.budgetMax) : "");
  const [bedrooms, setBedrooms] = useState("");
  const [timeline, setTimeline] = useState("");
  const [requirements, setRequirements] = useState("");
  const [contactMethod, setContactMethod] = useState<"chat" | "callback">("chat");
  const [contactChannel, setContactChannel] = useState<"whatsapp" | "phone">("whatsapp");
  const [phone, setPhone] = useState("");
  const [callbackWindow, setCallbackWindow] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;
  const asks = ASKS[intent] ?? {};
  const label = "mt-4 block text-xs font-semibold text-neutral-500";
  const input = "mt-1.5 h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none focus:border-neutral-400";

  function reset() {
    setStep(1); setIntent(""); setRequirements(""); setErr("");
    setContactMethod("chat"); setPhone(""); setCallbackWindow("");
    onClose();
  }

  async function submit() {
    setErr("");
    if (contactMethod === "callback" && !phone.trim()) { setErr("Add a number we can reach you on."); return; }
    setBusy(true);
    const res = await fetch("/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent, listingId: context?.id ?? null,
        propertyType: propertyType || null, locations: locations || null,
        budgetMin: budgetMin ? Number(budgetMin) : null,
        budgetMax: budgetMax ? Number(budgetMax) : null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        timeline: timeline || null, requirements: requirements || null,
        contactMethod, contactChannel: contactMethod === "callback" ? contactChannel : null,
        phone: phone || null, callbackWindow: callbackWindow || null,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(d?.error ?? "Could not send that. Try again."); return; }
    reset();
    if (contactMethod === "callback") {
      toast("Callback requested. A consultant will reach out.", "success");
    } else {
      router.push(d.threadId ? `/dashboard/messages?thread=${d.threadId}` : "/dashboard/messages");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[2px]" onClick={reset} />
      <div className="pop-up relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-[460px] sm:rounded-2xl">
        {/* Header */}
        <div className="shrink-0 px-5 pb-3 pt-4">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-neutral-200 sm:hidden" />
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button onClick={() => setStep((s) => (s === 3 ? 2 : 1) as 1 | 2)} aria-label="Back" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100">
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-900 text-white">
                <Headset size={15} />
              </span>
              <h3 className="truncate text-base font-semibold text-neutral-900">
                {step === 1 ? "How can we help?" : step === 2 ? "A few quick details" : "How should we reach you?"}
              </h3>
            </div>
            <button onClick={reset} aria-label="Close" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100">
              <X size={17} />
            </button>
          </div>

          {context && (
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-neutral-50 p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={context.image} alt="" className="h-12 w-14 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">You&apos;re asking about</div>
                <div className="truncate text-sm font-semibold text-neutral-900">{context.title}</div>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          {step === 1 && (
            <div className="space-y-2">
              {INTENTS.map((it) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.key}
                    onClick={() => { setIntent(it.key); setStep(ASKS[it.key] && Object.keys(ASKS[it.key]).length ? 2 : 3); }}
                    className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-left transition hover:border-neutral-400 hover:bg-neutral-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                      <Icon size={16} />
                    </span>
                    <span className="text-sm font-medium text-neutral-900">{it.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div>
              {asks.location && (
                <>
                  <label className={label}>Preferred location</label>
                  <input value={locations} onChange={(e) => setLocations(e.target.value)} placeholder="Lekki, Ikoyi, Port Harcourt…" className={input} />
                </>
              )}
              {asks.type && (
                <>
                  <label className={label}>Property type</label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {TYPES.map((t) => (
                      <button key={t} onClick={() => setPropertyType(propertyType === t ? "" : t)}
                        className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${propertyType === t ? "bg-brand-900 text-white" : "border border-neutral-200 text-neutral-600 hover:border-neutral-400"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {asks.budget && (
                <>
                  <label className={label}>Budget (₦)</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input value={budgetMin} onChange={(e) => setBudgetMin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Min" className={`${input} mt-0`} />
                    <span className="text-xs text-neutral-400">to</span>
                    <input value={budgetMax} onChange={(e) => setBudgetMax(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Max" className={`${input} mt-0`} />
                  </div>
                </>
              )}
              {asks.beds && (
                <>
                  <label className={label}>Bedrooms</label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {["1", "2", "3", "4", "5+"].map((n) => (
                      <button key={n} onClick={() => setBedrooms(bedrooms === n ? "" : n)}
                        className={`h-9 w-11 rounded-xl text-xs font-semibold transition ${bedrooms === n ? "bg-brand-900 text-white" : "border border-neutral-200 text-neutral-600 hover:border-neutral-400"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {asks.timeline && (
                <>
                  <label className={label}>Timeline</label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {TIMELINES.map((t) => (
                      <button key={t} onClick={() => setTimeline(timeline === t ? "" : t)}
                        className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${timeline === t ? "bg-brand-900 text-white" : "border border-neutral-200 text-neutral-600 hover:border-neutral-400"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <label className={label}>Anything else? (optional)</label>
              <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3}
                placeholder="Tell us more about what you need…"
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-400" />
            </div>
          )}

          {step === 3 && (
            <div>
              {intent === "question" && (
                <>
                  <label className={label}>What would you like to know?</label>
                  <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3}
                    placeholder="Type your question…"
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-400" />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(QUICK.question ?? []).map((qq) => (
                      <button key={qq} onClick={() => setRequirements(qq)}
                        className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-400">
                        {qq}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <label className={label}>How would you like to continue?</label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button onClick={() => setContactMethod("chat")}
                  className={`rounded-xl border px-3 py-3 text-left transition ${contactMethod === "chat" ? "border-brand-900 bg-brand-900/5" : "border-neutral-200 hover:border-neutral-400"}`}>
                  <div className="text-sm font-semibold text-neutral-900">Chat here</div>
                  <div className="text-[11px] text-neutral-500">Reply in Messages</div>
                </button>
                <button onClick={() => setContactMethod("callback")}
                  className={`rounded-xl border px-3 py-3 text-left transition ${contactMethod === "callback" ? "border-brand-900 bg-brand-900/5" : "border-neutral-200 hover:border-neutral-400"}`}>
                  <div className="text-sm font-semibold text-neutral-900">Call me back</div>
                  <div className="text-[11px] text-neutral-500">WhatsApp or phone</div>
                </button>
              </div>

              {contactMethod === "callback" && (
                <>
                  <label className={label}>Number to reach you</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="080..." className={input} />
                  <div className="mt-2 flex gap-2">
                    {(["whatsapp", "phone"] as const).map((ch) => (
                      <button key={ch} onClick={() => setContactChannel(ch)}
                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold capitalize transition ${contactChannel === ch ? "bg-brand-900 text-white" : "border border-neutral-200 text-neutral-600 hover:border-neutral-400"}`}>
                        {ch === "whatsapp" ? "WhatsApp" : "Phone call"}
                      </button>
                    ))}
                  </div>
                  <label className={label}>Best time (optional)</label>
                  <input value={callbackWindow} onChange={(e) => setCallbackWindow(e.target.value)} placeholder="Weekday mornings" className={input} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step > 1 && (
          <div className="shrink-0 border-t border-neutral-100 px-5 py-4">
            {err && <p className="mb-2 text-xs text-red-600">{err}</p>}
            {step === 2 ? (
              <button onClick={() => setStep(3)} className="btn-text h-11 w-full rounded-xl bg-brand-900 text-white transition hover:bg-brand-500">
                Continue
              </button>
            ) : (
              <button onClick={submit} disabled={busy}
                className="btn-text flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-900 text-white transition hover:bg-brand-500 disabled:opacity-50">
                <Check size={15} /> {busy ? "Sending…" : contactMethod === "callback" ? "Request callback" : "Start conversation"}
              </button>
            )}
            <p className="mt-2 text-center text-[11px] text-neutral-400">
              A real member of the E-Access team will help you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
