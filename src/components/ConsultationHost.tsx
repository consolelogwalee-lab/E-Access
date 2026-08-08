"use client";
import { useEffect, useState } from "react";
import { ConsultationSheet } from "@/components/ConsultationSheet";

export type ConsultContext = {
  id: number; title: string; price: number; image: string; area?: string; city?: string;
} | null;

/**
 * Opens the consultation intake sheet from anywhere.
 * Follows the same custom-event convention already used for the filter drawer
 * and the sidebar, so no CTA needs to own sheet state.
 */
export function openConsultation(context?: ConsultContext) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("eaccess-consult-open", { detail: { context: context ?? null } }));
}

/** Mounted once in the root layout. Renders nothing until something opens it. */
export function ConsultationHost() {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<ConsultContext>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { context?: ConsultContext } | undefined;
      setContext(detail?.context ?? null);
      setOpen(true);
    };
    window.addEventListener("eaccess-consult-open", onOpen);

    // Deep link used after a sign-in redirect: /dashboard?consult=1
    try {
      if (new URLSearchParams(window.location.search).get("consult") === "1") setOpen(true);
    } catch { /* non-browser env */ }

    return () => window.removeEventListener("eaccess-consult-open", onOpen);
  }, []);

  return <ConsultationSheet open={open} onClose={() => setOpen(false)} context={context} />;
}
