"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { AuthShell, AuthHeading, Field, inputCls } from "@/components/auth/AuthShell";

function ResetInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = password.length >= 8 && password === confirm;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/forgot", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Reset failed.");
    router.push("/auth/login");
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Reset Your Password"
        sub="Choose a new password for your account. Make it strong and easy for you to remember."
      />
      <form onSubmit={submit} className="space-y-5">
        <Field label="New Password" error={password && password.length < 8 ? "At least 8 characters." : undefined}>
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
        <Field label="Confirm Password" error={confirm && confirm !== password ? "Passwords don't match." : undefined}>
          <input
            className={inputCls}
            type={show ? "text" : "password"}
            placeholder="Repeat your new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={!valid || busy}
          className={`btn-text flex h-[52px] w-full items-center justify-center gap-2 rounded-xl transition ${
            valid ? "bg-brand-900 text-white hover:bg-brand-500" : "bg-neutral-300 text-white"
          }`}
        >
          {busy ? "Resetting…" : "Reset Password"} <ArrowRight size={16} />
        </button>
      </form>
    </AuthShell>
  );
}

export default function Reset() {
  return <Suspense><ResetInner /></Suspense>;
}
