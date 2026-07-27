"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Home, KeyRound, LandPlot, Building2, Warehouse, MapPin } from "lucide-react";
import { AuthShell, AuthHeading } from "@/components/auth/AuthShell";

const TYPES = [
  { key: "land", label: "Land", icon: LandPlot },
  { key: "apartment", label: "Apartment", icon: Building2 },
  { key: "duplex", label: "Duplex", icon: Home },
  { key: "commercial", label: "Commercial", icon: Warehouse },
];
const BUDGETS = ["Under ₦5m", "₦5m – ₦50m", "₦50m – ₦150m", "Above ₦150m"];
const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu"];

function PreferencesInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [purpose, setPurpose] = useState<"buy" | "rent">("buy");
  const [types, setTypes] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const valid = types.length > 0 && budget && cities.length > 0;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    await fetch("/api/auth/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose, types, budget, locations: cities }),
    });
    const next = sp.get("next");
    router.push(`/auth/ready${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }

  function toggle(arr: string[], set: (v: string[]) => void, v: string) {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  return (
    <AuthShell topRight={null} footer="You can update these preferences anytime from your dashboard.">
      <AuthHeading
        title="Set Your Preferences"
        sub="Tell us what you're looking for so we can personalise your property recommendations."
      />
      <div className="space-y-8">
        <div>
          <span className="label-lg mb-3 block text-neutral-900">I&apos;m looking to</span>
          <div className="grid grid-cols-2 gap-3">
            {(["buy", "rent"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPurpose(p)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold capitalize transition ${
                  purpose === p ? "border-brand-500 bg-brand-500/5 text-brand-500" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                {p === "buy" ? <KeyRound size={16} /> : <Home size={16} />} {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label-lg mb-3 block text-neutral-900">Property types</span>
          <div className="grid grid-cols-2 gap-3">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => toggle(types, setTypes, t.key)}
                className={`flex items-center gap-2.5 rounded-xl border px-4 py-3.5 text-sm font-medium transition ${
                  types.includes(t.key) ? "border-brand-500 bg-brand-500/5 text-brand-500" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label-lg mb-3 block text-neutral-900">Budget range</span>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <button
                key={b}
                onClick={() => setBudget(b)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  budget === b ? "border-brand-500 bg-brand-500 text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label-lg mb-3 block text-neutral-900">Preferred locations</span>
          <div className="flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => toggle(cities, setCities, c)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  cities.includes(c) ? "border-brand-500 bg-brand-500 text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                }`}
              >
                <MapPin size={13} /> {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!valid || busy}
          className={`btn-text flex h-[52px] w-full items-center justify-center gap-2 rounded-xl transition ${
            valid ? "bg-brand-900 text-white hover:bg-brand-500" : "bg-neutral-300 text-white"
          }`}
        >
          {busy ? "Saving…" : "Continue"} <ArrowRight size={16} />
        </button>
      </div>
    </AuthShell>
  );
}

export default function Preferences() {
  return <Suspense><PreferencesInner /></Suspense>;
}
