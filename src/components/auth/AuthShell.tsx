import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export function AuthShell({
  children,
  footer = "Your information is securely protected and never shared without authorisation.",
  topRight = { text: "Already have an account?", cta: "Log in", href: "/auth/login" },
}: {
  children: React.ReactNode;
  footer?: string;
  topRight?: { text: string; cta: string; href: string } | null;
}) {
  return (
    <main className="flex min-h-screen bg-neutral-100">
      <div
        className="hidden flex-1 bg-cover bg-center lg:block"
        style={{ backgroundImage: "url(/images/auth-city.svg)" }}
      />
      <div className="flex min-h-screen w-full flex-col rounded-none bg-white p-6 shadow-2xl lg:m-2.5 lg:min-h-[calc(100vh-20px)] lg:w-[620px] lg:shrink-0 lg:rounded-2xl">
        <div className="flex items-center justify-between">
          <Link href="/"><LogoMark size={40} /></Link>
          {topRight && (
            <Link
              href={topRight.href}
              className="flex items-center gap-1.5 text-sm text-support-blue transition hover:underline"
            >
              {topRight.text} <span className="font-semibold">{topRight.cta}</span>
              <ArrowRight size={15} />
            </Link>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="mx-auto w-full max-w-[418px]">{children}</div>
        </div>
        <p className="pb-2 text-center text-xs text-neutral-400">{footer}</p>
      </div>
    </main>
  );
}

export function AuthHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-10 text-center">
      <h1 className="text-[24px] font-semibold leading-8 text-neutral-900">{title}</h1>
      <p className="body-md mx-auto mt-3 max-w-[400px] text-neutral-400">{sub}</p>
    </div>
  );
}

export function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="caption mb-1.5 block text-neutral-500">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export const inputCls =
  "h-12 w-full rounded-xl bg-neutral-100 px-4 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-brand-500/50";
