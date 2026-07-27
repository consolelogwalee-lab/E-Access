"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AuthShell, AuthHeading, Field, inputCls } from "@/components/auth/AuthShell";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    setLink(data.simulatedResetLink);
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Forgot Your Password?"
        sub="Enter the email linked to your account and we'll send you a link to reset your password."
      />
      {link ? (
        <div className="rounded-xl border border-dashed border-lime-600/40 bg-lime-50 p-5 text-center">
          <p className="caption text-neutral-500">Demo mode: no real email is sent.</p>
          <p className="body-md mt-2 text-neutral-700">Your reset link:</p>
          <Link href={link} className="mt-1 inline-block break-all text-sm font-semibold text-support-blue underline">
            Open reset link →
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <Field label="Email">
            <input className={inputCls} type="email" placeholder="youremail@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy || !email}
            className={`btn-text flex h-[52px] w-full items-center justify-center gap-2 rounded-xl transition ${
              email ? "bg-brand-900 text-white hover:bg-brand-500" : "bg-neutral-300 text-white"
            }`}
          >
            {busy ? "Sending…" : "Send Reset Link"} <ArrowRight size={16} />
          </button>
        </form>
      )}
    </AuthShell>
  );
}
