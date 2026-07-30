"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { AuthShell, AuthHeading } from "@/components/auth/AuthShell";
import { SocialButtons } from "@/components/auth/SocialButtons";

function EntryInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next");
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  const error = sp.get("error");
  return (
    <AuthShell>
      <AuthHeading
        title="Welcome to E-Access"
        sub="Create an account to explore verified properties, validate your documents, and access personalised recommendations."
      />
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
          {error === "email"
            ? "That sign-in didn't share an email address with us. Try another method."
            : "Sign-in was interrupted. Please try again."}
        </p>
      )}
      <div className="space-y-4">
        <button
          onClick={() => router.push(`/auth/signup${q}`)}
          className="btn-text flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-brand-900 text-white transition hover:bg-brand-500"
        >
          <Mail size={17} /> Continue with Email
        </button>
      </div>
      <SocialButtons />
      <p className="mt-6 text-center text-xs text-neutral-500">
        By continuing, you agree to E-Access&apos;{" "}
        <a href="/legal/terms" className="underline hover:text-neutral-700">Terms of Use</a> and{" "}
        <a href="/legal/privacy" className="underline hover:text-neutral-700">Privacy Policy</a>.
      </p>
    </AuthShell>
  );
}

export default function Entry() {
  return <Suspense><EntryInner /></Suspense>;
}
