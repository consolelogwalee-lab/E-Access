"use client";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";

const TYPES = ["land", "apartment", "duplex", "commercial"];
const BUDGETS = ["Under ₦5m", "₦5m – ₦50m", "₦50m – ₦150m", "Above ₦150m"];
const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu"];

type Prefs = { purpose?: string; types?: string[]; budget?: string; locations?: string[] };

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState<Prefs>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<{ section: string; text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => {
      if (d.user) {
        setFullName(d.user.full_name);
        setEmail(d.user.email);
        try { setPrefs(JSON.parse(d.user.preferences_json ?? "{}") ?? {}); } catch { /* ignore */ }
      }
    });
  }, []);

  async function saveProfile() {
    setBusy("profile");
    const res = await fetch("/api/me", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName }),
    });
    const d = await res.json();
    setMsg({ section: "profile", text: res.ok ? "Profile saved." : d.error, ok: res.ok });
    setBusy("");
  }

  async function savePassword() {
    setBusy("password");
    const res = await fetch("/api/me", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const d = await res.json();
    setMsg({ section: "password", text: res.ok ? "Password updated." : d.error, ok: res.ok });
    if (res.ok) { setCurrentPassword(""); setNewPassword(""); }
    setBusy("");
  }

  async function savePrefs() {
    setBusy("prefs");
    const res = await fetch("/api/auth/preferences", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setMsg({ section: "prefs", text: res.ok ? "Preferences saved." : "Failed to save.", ok: res.ok });
    setBusy("");
  }

  function toggle(key: "types" | "locations", v: string) {
    setPrefs((p) => {
      const arr = p[key] ?? [];
      return { ...p, [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });
  }

  const inputCls = "h-11 w-full rounded-xl bg-neutral-100 px-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/40";
  const Msg = ({ section }: { section: string }) =>
    msg?.section === section ? (
      <p className={`mt-2 text-sm ${msg.ok ? "text-lime-600" : "text-red-600"}`}>{msg.text}</p>
    ) : null;

  return (
    <div>
      <Topbar crumbs={[["Main", "/dashboard"], ["Settings", ""]]} showRegion={false} searchPlaceholder="Search settings" />
      <h1 className="h3 mt-6 text-neutral-900">Settings</h1>

      <div className="mt-6 grid max-w-[900px] gap-4 lg:grid-cols-2">
        {/* Profile */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Profile</h2>
          <label className="mt-4 block">
            <span className="caption mb-1.5 block text-neutral-500">Full Name</span>
            <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
          <label className="mt-4 block">
            <span className="caption mb-1.5 block text-neutral-500">Email</span>
            <input className={`${inputCls} text-neutral-400`} value={email} disabled />
          </label>
          <button onClick={saveProfile} disabled={busy === "profile"} className="btn-text mt-5 h-11 rounded-xl bg-brand-900 px-6 text-white transition hover:bg-brand-500 disabled:opacity-60">
            Save Profile
          </button>
          <Msg section="profile" />
        </div>

        {/* Password */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Change Password</h2>
          <label className="mt-4 block">
            <span className="caption mb-1.5 block text-neutral-500">Current Password</span>
            <input type="password" className={inputCls} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </label>
          <label className="mt-4 block">
            <span className="caption mb-1.5 block text-neutral-500">New Password</span>
            <input type="password" className={inputCls} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
          </label>
          <button
            onClick={savePassword}
            disabled={busy === "password" || !currentPassword || newPassword.length < 8}
            className="btn-text mt-5 h-11 rounded-xl bg-brand-900 px-6 text-white transition hover:bg-brand-500 disabled:opacity-40"
          >
            Update Password
          </button>
          <Msg section="password" />
        </div>

        {/* Preferences */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-neutral-900">Property Preferences</h2>
          <p className="body-r mt-1 text-neutral-400">These shape your Discover recommendations.</p>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <span className="label-sm mb-2.5 block text-neutral-900">Property types</span>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggle("types", t)}
                    className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium capitalize transition ${
                      prefs.types?.includes(t) ? "border-brand-500 bg-brand-500 text-white" : "border-neutral-200 text-neutral-600"
                    }`}
                  >
                    {prefs.types?.includes(t) && <Check size={13} />} {t}
                  </button>
                ))}
              </div>
              <span className="label-sm mb-2.5 mt-6 block text-neutral-900">Budget range</span>
              <div className="flex flex-wrap gap-2">
                {BUDGETS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setPrefs((p) => ({ ...p, budget: b }))}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      prefs.budget === b ? "border-brand-500 bg-brand-500 text-white" : "border-neutral-200 text-neutral-600"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="label-sm mb-2.5 block text-neutral-900">Preferred locations</span>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggle("locations", c)}
                    className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      prefs.locations?.includes(c) ? "border-brand-500 bg-brand-500 text-white" : "border-neutral-200 text-neutral-600"
                    }`}
                  >
                    {prefs.locations?.includes(c) && <Check size={13} />} {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={savePrefs} disabled={busy === "prefs"} className="btn-text mt-6 h-11 rounded-xl bg-brand-900 px-6 text-white transition hover:bg-brand-500 disabled:opacity-60">
            Save Preferences
          </button>
          <Msg section="prefs" />
        </div>
      </div>
    </div>
  );
}
