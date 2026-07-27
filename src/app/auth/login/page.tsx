"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { AuthShell, AuthHeading, Field, inputCls } from "@/components/auth/AuthShell";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Login failed.");
    const next = sp.get("next");
    if (!data.emailVerified) router.push("/auth/verify");
    else if (!data.hasPreferences) router.push("/auth/preferences");
    else router.push(next ?? "/dashboard");
  }

  return (
    <AuthShell topRight={{ text: "New to E-Access?", cta: "Sign up", href: "/auth" }}>
      <AuthHeading
        title="Welcome Back"
        sub="Log in to continue exploring verified properties and manage your portfolio."
      />
      <form onSubmit={submit} className="space-y-5">
        <Field label="Email">
          <input className={inputCls} type="email" placeholder="youremail@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input
              className={inputCls}
              type={show ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>
        <div className="flex justify-end">
          <Link href="/auth/forgot" className="text-sm font-medium text-support-blue hover:underline">
            Forgot password?
          </Link>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !email || !password}
          className={`btn-text flex h-[52px] w-full items-center justify-center gap-2 rounded-xl transition ${
            email && password ? "bg-brand-900 text-white hover:bg-brand-500" : "bg-neutral-300 text-white"
          }`}
        >
          {busy ? "Logging in…" : "Log In"} <ArrowRight size={16} />
        </button>
        <p className="pt-2 text-center text-xs text-neutral-400">
          Demo account: <span className="font-mono">wale@eaccess.demo</span> / <span className="font-mono">password123</span>
        </p>
      </form>
    </AuthShell>
  );
}

export default function Login() {
  return <Suspense><LoginInner /></Suspense>;
}
