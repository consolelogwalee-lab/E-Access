"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

/** Branded replacements for alert()/confirm(). Mount <UiHost /> once (root layout). */

type ToastMsg = { id: number; text: string; kind: "info" | "success" | "warn" };
type ConfirmReq = { text: string; confirmLabel?: string; resolve: (ok: boolean) => void };

let toastSeq = 1;

export function toast(text: string, kind: ToastMsg["kind"] = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("eaccess-toast", { detail: { id: toastSeq++, text, kind } }));
}

export function appConfirm(text: string, confirmLabel = "Yes, continue"): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent("eaccess-confirm", { detail: { text, confirmLabel, resolve } }));
  });
}

export function UiHost() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [confirmReq, setConfirmReq] = useState<ConfirmReq | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => {
      const t = (e as CustomEvent).detail as ToastMsg;
      setToasts((all) => [...all, t]);
      setTimeout(() => setToasts((all) => all.filter((x) => x.id !== t.id)), 3600);
    };
    const onConfirm = (e: Event) => setConfirmReq((e as CustomEvent).detail as ConfirmReq);
    window.addEventListener("eaccess-toast", onToast);
    window.addEventListener("eaccess-confirm", onConfirm);
    return () => {
      window.removeEventListener("eaccess-toast", onToast);
      window.removeEventListener("eaccess-confirm", onConfirm);
    };
  }, []);

  function answer(ok: boolean) {
    confirmReq?.resolve(ok);
    setConfirmReq(null);
  }

  return (
    <>
      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="fade-slide pointer-events-auto flex max-w-[420px] items-center gap-2.5 rounded-full bg-neutral-950/95 py-3 pl-4 pr-5 text-sm text-white shadow-2xl shadow-black/30 backdrop-blur"
          >
            {t.kind === "success" ? <CheckCircle2 size={16} className="shrink-0 text-lime-400" />
              : t.kind === "warn" ? <AlertTriangle size={16} className="shrink-0 text-[#E2A600]" />
              : <Info size={16} className="shrink-0 text-white/60" />}
            {t.text}
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {confirmReq && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-[2px]" onClick={() => answer(false)}>
          <div className="fade-slide w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
              <AlertTriangle size={20} className="text-[#E2A600]" />
            </span>
            <p className="body-lg mt-4 text-neutral-800">{confirmReq.text}</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => answer(false)} className="btn-text h-11 flex-1 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                Cancel
              </button>
              <button onClick={() => answer(true)} className="btn-text h-11 flex-1 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800">
                {confirmReq.confirmLabel ?? "Yes, continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
