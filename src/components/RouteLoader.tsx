"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/Logo";

/**
 * Global navigation feedback: a centered bouncing E-Access logo shown while the
 * next page loads. It appears the moment an internal link is tapped and clears
 * once the route (pathname) changes, so users never stare at a frozen screen.
 */
export function RouteLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // Clear the loader whenever the route actually changes.
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  // Show it as soon as an internal navigation begins.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      const target = a.getAttribute("target");
      if (!href || target === "_blank" || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      // Only same-origin, path-changing navigations.
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
        // API routes do a hard redirect (e.g. consultant/start) — still worth showing feedback.
        setLoading(true);
      } catch {
        /* ignore */
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Safety: never let the overlay get stuck.
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/70 backdrop-blur-[2px]" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center">
        <div className="logo-bounce drop-shadow-xl">
          <LogoMark size={58} />
        </div>
        <div className="logo-shadow mt-2 h-2 w-12 rounded-[50%] bg-neutral-900/30 blur-[2px]" />
      </div>
    </div>
  );
}
