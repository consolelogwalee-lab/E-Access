"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

function ReadyInner() {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <AuthShell topRight={null}>
      <div className="text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-lime-100">
          <BadgeCheck size={38} className="text-lime-600" />
        </span>
        <h1 className="mt-8 text-[24px] font-semibold leading-8 text-neutral-900">Your Account is Ready</h1>
        <p className="body-md mx-auto mt-3 max-w-[380px] text-neutral-400">
          Welcome to E-Access. Your preferences are saved and your personalised
          property feed is waiting for you.
        </p>
        <button
          onClick={() => router.push(sp.get("next") ?? "/dashboard")}
          className="btn-text mx-auto mt-10 flex h-[52px] w-full max-w-[320px] items-center justify-center gap-2 rounded-xl bg-brand-900 text-white transition hover:bg-brand-500"
        >
          Go to Dashboard <ArrowRight size={16} />
        </button>
      </div>
    </AuthShell>
  );
}

export default function Ready() {
  return <Suspense><ReadyInner /></Suspense>;
}
