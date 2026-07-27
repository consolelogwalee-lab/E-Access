import { BadgeCheck, Clock3, ShieldAlert, ShieldQuestion } from "lucide-react";

export function VerificationBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "text-[11px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  const icon = size === "sm" ? 12 : 14;
  switch (status) {
    case "verified":
      return (
        <span className={`inline-flex items-center rounded-full bg-lime-100 text-lime-600 font-semibold ${cls}`}>
          <BadgeCheck size={icon} /> Verified
        </span>
      );
    case "under_review":
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-100 text-amber-700 font-semibold ${cls}`}>
          <Clock3 size={icon} /> Under Review
        </span>
      );
    case "action_required":
      return (
        <span className={`inline-flex items-center rounded-full bg-red-100 text-red-700 font-semibold ${cls}`}>
          <ShieldAlert size={icon} /> Action Required
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-neutral-100 text-neutral-500 font-semibold ${cls}`}>
          <ShieldQuestion size={icon} /> Unverified
        </span>
      );
  }
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "lime" | "dark" }) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-600",
    lime: "bg-lime-100 text-lime-600",
    dark: "bg-neutral-900 text-white",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
