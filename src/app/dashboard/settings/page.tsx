"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Camera, Trash2 } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";

const TYPES = ["land", "apartment", "duplex", "commercial"];
const BUDGETS = ["Under ₦5m", "₦5m – ₦50m", "₦50m – ₦150m", "Above ₦150m"];
const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu"];

type Prefs = { purpose?: string; types?: string[]; budget?: string; locations?: string[] };

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState("#0D06A7");
  const fileRef = useRef<HTMLInputElement>(null);
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
        setAvatarUrl(d.user.avatar_url ?? null);
        setAvatarColor(d.user.avatar_color ?? "#0D06A7");
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

  async function uploadAvatar(file: File) {
    setBusy("avatar");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "photo");
    const up = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await up.json().catch(() => ({}));
    if (!d.ok || !d.url) {
      setMsg({ section: "profile", text: d.disabled ? "Photo storage isn't set up yet." : (d.error ?? "Upload failed."), ok: false });
      setBusy("");
      return;
    }
    await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: d.url }) });
    setAvatarUrl(d.url);
    setMsg({ section: "profile", text: "Photo updated.", ok: true });
    setBusy("");
  }
  async function removeAvatar() {
    setBusy("avatar");
    await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: "" }) });
    setAvatarUrl(null);
    setMsg({ section: "profile", text: "Photo removed.", ok: true });
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

          {/* Profile photo */}
          <div className="mt-4 flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-neutral-200" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white ring-2 ring-neutral-200" style={{ background: avatarColor }}>
                {fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "EA"}
              </span>
            )}
            <div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              <div className="flex flex-wrap gap-2">
                <button onClick={() => fileRef.current?.click()} disabled={busy === "avatar"} className="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3.5 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60">
                  <Camera size={15} /> {busy === "avatar" ? "Uploading…" : avatarUrl ? "Change photo" : "Upload photo"}
                </button>
                {avatarUrl && (
                  <button onClick={removeAvatar} disabled={busy === "avatar"} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                    <Trash2 size={15} /> Remove
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-neutral-400">JPG, PNG or WebP, up to 10MB. Otherwise your initials are used.</p>
            </div>
          </div>

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
