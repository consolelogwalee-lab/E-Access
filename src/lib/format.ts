export function naira(n: number | string): string {
  return "₦" + Number(n).toLocaleString("en-NG");
}

export function timeAgo(iso: string): string {
  const then = new Date(iso + (iso.endsWith("Z") ? "" : "Z")).getTime();
  const s = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

export const VERIFICATION_LABEL: Record<string, string> = {
  verified: "Verified",
  under_review: "Under Review",
  unverified: "Unverified",
  action_required: "Action Required",
};

export const TYPE_LABEL: Record<string, string> = {
  land: "Residential Land",
  apartment: "Apartment",
  duplex: "Duplex",
  commercial: "Commercial",
};
