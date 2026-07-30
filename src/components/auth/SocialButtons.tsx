"use client";
import { useEffect, useState } from "react";

const ICONS: Record<string, React.ReactNode> = {
  google: (
    <svg width="17" height="17" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  ),
  facebook: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z" />
    </svg>
  ),
  microsoft: (
    <svg width="16" height="16" viewBox="0 0 23 23">
      <rect width="10" height="10" x="1" y="1" fill="#F35325" />
      <rect width="10" height="10" x="12" y="1" fill="#81BC06" />
      <rect width="10" height="10" x="1" y="12" fill="#05A6F0" />
      <rect width="10" height="10" x="12" y="12" fill="#FFBA08" />
    </svg>
  ),
};

const LABELS: Record<string, string> = {
  google: "Continue with Google",
  facebook: "Continue with Facebook",
  microsoft: "Continue with Microsoft",
};

export function SocialButtons({ className = "" }: { className?: string }) {
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/auth/providers").then((r) => r.json()).then((d) => setProviders(d.providers ?? [])).catch(() => {});
  }, []);

  if (!providers.length) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs text-neutral-400">or</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
      <div className="mt-4 space-y-3">
        {providers.map((p) => (
          <a
            key={p}
            href={`/api/auth/oauth/${p}`}
            className="btn-text flex h-[50px] w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50"
          >
            {ICONS[p]} {LABELS[p]}
          </a>
        ))}
      </div>
    </div>
  );
}
