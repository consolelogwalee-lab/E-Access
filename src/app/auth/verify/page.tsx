"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, AuthHeading } from "@/components/auth/AuthShell";

function VerifyInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setDemoCode(sessionStorage.getItem("eaccess_demo_code") ?? "");
  }, []);

  function setDigit(i: number, v: string) {
    const c = v.replace(/\D/g, "").slice(-1);
    setDigits((d) => {
      const n = [...d];
      n[i] = c;
      return n;
    });
    if (c && i < 5) refs.current[i + 1]?.focus();
  }

  async function submit(code: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Verification failed.");
    sessionStorage.removeItem("eaccess_demo_code");
    const next = sp.get("next");
    router.push(`/auth/preferences${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }

  useEffect(() => {
    const code = digits.join("");
    if (code.length === 6) submit(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  async function resend() {
    const res = await fetch("/api/auth/verify", { method: "PUT" });
    const data = await res.json();
    if (res.ok && data.simulatedEmailCode) {
      setDemoCode(data.simulatedEmailCode);
      sessionStorage.setItem("eaccess_demo_code", data.simulatedEmailCode);
    }
  }

  return (
    <AuthShell topRight={null}>
      <AuthHeading
        title="Verify Your Email"
        sub="We sent a 6-digit code to your email address. Enter it below to confirm your account."
      />
      <div className="flex justify-center gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            value={d}
            inputMode="numeric"
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
            }}
            className="h-14 w-12 rounded-xl bg-neutral-100 text-center text-xl font-semibold outline-none transition focus:bg-white focus:ring-2 focus:ring-brand-500/50"
          />
        ))}
      </div>
      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
      {demoCode && (
        <div className="mx-auto mt-8 max-w-[340px] rounded-xl border border-dashed border-lime-600/40 bg-lime-50 p-4 text-center">
          <p className="caption text-neutral-500">Demo mode: no real email is sent.</p>
          <p className="mt-1 text-sm text-neutral-700">
            Your verification code is <span className="text-lg font-bold tracking-widest text-lime-600">{demoCode}</span>
          </p>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-neutral-500">
        Didn&apos;t get a code?{" "}
        <button onClick={resend} className="font-semibold text-support-blue hover:underline">Resend</button>
      </p>
    </AuthShell>
  );
}

export default function Verify() {
  return <Suspense><VerifyInner /></Suspense>;
}
