"use client";
import { useEffect, useState } from "react";
import { X, MapPinCheckInside, Video, Calendar, Clock, BadgeCheck } from "lucide-react";
import Link from "next/link";

export function BookInspectionDrawer({
  listingId, listingTitle, listingLocation = "", initialDate = "", initialTime = "", open, onClose,
}: {
  listingId: number;
  listingTitle: string;
  listingLocation?: string;
  initialDate?: string;
  initialTime?: string;
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"physical" | "remote">("physical");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    if (open) {
      if (initialDate) setDate(initialDate);
      if (initialTime) setTime(initialTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  async function submit() {
    if (busy) return;
    setError("");
    if (!date || !time) return setError("Pick a date and time for your inspection.");
    setBusy(true);
    const res = await fetch("/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, mode, date, time, notes }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Booking failed.");
    setSuccess(true);
  }

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="absolute inset-y-0 right-0 flex w-full max-w-[426px] flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="flex flex-1 flex-col justify-center overflow-y-auto px-7 py-8 scroll-thin">
            <div className="text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime-100">
                <BadgeCheck size={32} className="text-lime-600" />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-neutral-900">Inspection Request Submitted</h2>
              <p className="body-md mt-2 text-neutral-500">
                Your inspection request has been submitted successfully. You&apos;ll receive updates and
                scheduling confirmations through your dashboard and messages.
              </p>
            </div>
            <dl className="mt-7 divide-y divide-neutral-100 rounded-2xl border border-neutral-100">
              {[
                ["Property", listingTitle],
                listingLocation ? ["Location", listingLocation] : null,
                ["Inspection Type", mode === "remote" ? "Remote Inspection" : "Physical Site Inspection"],
                ["Scheduled Date", date],
                ["Preferred Time", time],
                mode === "remote" ? ["Remote Support", "Virtual Walkthrough & Documentation Review"] : null,
              ]
                .filter(Boolean)
                .map((row) => {
                  const [k, v] = row as [string, string];
                  return (
                    <div key={k} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                      <dt className="shrink-0 text-neutral-400">{k}</dt>
                      <dd className="text-right font-medium text-neutral-800">{v}</dd>
                    </div>
                  );
                })}
            </dl>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <Link
                href="/dashboard/inspections"
                className="btn-text flex h-11 items-center justify-center rounded-xl bg-brand-900 px-2 text-center text-white transition hover:bg-brand-500"
              >
                View Inspection Status
              </Link>
              <Link
                href="/api/consultant/start"
                className="btn-text flex h-11 items-center justify-center rounded-xl border border-neutral-200 px-2 text-neutral-800 transition hover:bg-neutral-50"
              >
                Speak to a Consultant
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
              <h2 className="h4 text-neutral-900">Schedule an Inspection</h2>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6 scroll-thin">
              <div>
                <span className="label-lg block text-neutral-900">Choose Inspection Type</span>
                <p className="body-r mt-1 text-neutral-400">
                  Schedule a guided property inspection or request remote assistance to review the property on your behalf.
                </p>
                <div className="mt-4 space-y-3">
                  <button
                    onClick={() => setMode("physical")}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                      mode === "physical" ? "border-brand-500 bg-brand-500/5" : "border-neutral-200"
                    }`}
                  >
                    <MapPinCheckInside size={19} className={mode === "physical" ? "text-brand-500" : "text-neutral-400"} />
                    <span>
                      <span className="block text-sm font-semibold text-neutral-900">Physical Inspection</span>
                      <span className="body-r mt-0.5 block text-neutral-400">
                        Visit the property in person with a verified consultant guiding the tour.
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => setMode("remote")}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                      mode === "remote" ? "border-brand-500 bg-brand-500/5" : "border-neutral-200"
                    }`}
                  >
                    <Video size={19} className={mode === "remote" ? "text-brand-500" : "text-neutral-400"} />
                    <span>
                      <span className="block text-sm font-semibold text-neutral-900">Remote Inspection</span>
                      <span className="body-r mt-0.5 block text-neutral-400">
                        A consultant inspects on your behalf with live video and a written report.
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <span className="label-lg mb-3 block text-neutral-900">Select Preferred Schedule</span>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-11 w-full rounded-xl bg-neutral-100 px-3 pr-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
                    />
                    <Calendar size={15} className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-neutral-400" />
                  </div>
                  <span className="text-sm text-neutral-400">at</span>
                  <div className="relative flex-1">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="h-11 w-full rounded-xl bg-neutral-100 px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
                    />
                    <Clock size={15} className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>
              </div>

              <div>
                <span className="label-lg mb-3 block text-neutral-900">Additional Information</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any specific questions or inspection requests..."
                  rows={4}
                  className="w-full rounded-xl bg-neutral-100 p-4 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="border-t border-neutral-100 px-6 py-4">
              <button
                onClick={submit}
                disabled={busy}
                className="btn-text h-12 w-full rounded-xl bg-brand-900 text-white transition hover:bg-brand-500 disabled:opacity-60"
              >
                {busy ? "Booking…" : "Book Inspection"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
