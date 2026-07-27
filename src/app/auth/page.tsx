"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 11v3.6h5.1c-.5 2.3-2.5 3.9-5.1 3.9a5.5 5.5 0 1 1 0-11c1.4 0 2.7.5 3.7 1.4l2.6-2.6A9.1 9.1 0 1 0 12 21.1c5.2 0 8.7-3.7 8.7-8.9 0-.4 0-.8-.1-1.2H12z" />
  </svg>
);
const AppleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.7 12.9c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.7-3.9zM14.3 5.6c.7-.8 1.1-1.9 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" />
  </svg>
);
import { AuthShell, AuthHeading } from "@/components/auth/AuthShell";

function EntryInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next");
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <AuthShell>
      <AuthHeading
        title="Welcome to E-Access"
        sub="Create an account to explore verified properties, track interests, and access personalised property recommendations."
      />
      <div className="space-y-4">
        <button
          onClick={() => router.push(`/auth/signup${q}`)}
          className="btn-text flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-brand-900 text-white transition hover:bg-brand-500"
        >
          <Mail size={17} /> Continue with Email
        </button>
        <button
          onClick={() => alert("Google sign-in is not configured in this demo build. Please use email instead.")}
          className="btn-text flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 transition hover:bg-neutral-50"
        >
          <GoogleIcon /> Continue with Google
        </button>
        <button
          onClick={() => alert("Apple sign-in is not configured in this demo build. Please use email instead.")}
          className="btn-text flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 transition hover:bg-neutral-50"
        >
          <AppleIcon /> Continue with Apple
        </button>
      </div>
      <p className="mt-6 text-center text-xs text-neutral-500">
        By continuing, you agree to E-Access&apos;<br />Terms of Use and Privacy Policy.
      </p>
    </AuthShell>
  );
}

export default function Entry() {
  return <Suspense><EntryInner /></Suspense>;
}
