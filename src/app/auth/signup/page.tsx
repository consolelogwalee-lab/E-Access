"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { AuthShell, AuthHeading, Field, inputCls } from "@/components/auth/AuthShell";

function SignupInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = fullName.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && password.length >= 8;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    if (data.simulatedEmailCode) sessionStorage.setItem("eaccess_demo_code", data.simulatedEmailCode);
    else sessionStorage.removeItem("eaccess_demo_code");
    const next = sp.get("next");
    router.push(`/auth/verify${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }

  return (
    <AuthShell footer="Your information is securely protected and only used to support your property experience.">
      <AuthHeading
        title="Create Your Account"
        sub="Set up your account to access verified listings, personalised recommendations, and secure property tools."
      />
      <form onSubmit={submit} className="space-y-5">
        <Field label="Full Name">
          <input className={inputCls} placeholder="Your names" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Email">
          <input className={inputCls} type="email" placeholder="youremail@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" error={password && password.length < 8 ? "At least 8 characters." : undefined}>
          <div className="relative">
            <input
              className={inputCls}
              type={show ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={!valid || busy}
          className={`btn-text flex h-[52px] w-full items-center justify-center gap-2 rounded-xl transition ${
            valid ? "bg-brand-900 text-white hover:bg-brand-500" : "bg-neutral-300 text-white"
          }`}
        >
          {busy ? "Creating…" : "Create Account"} <ArrowRight size={16} />
        </button>
      </form>
    </AuthShell>
  );
}

export default function Signup() {
  return <Suspense><SignupInner /></Suspense>;
}
