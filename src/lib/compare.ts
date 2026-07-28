"use client";

export const COMPARE_EVENT = "eaccess-compare-change";
const KEY = "eaccess_compare";
const MAX = 3;

export function getCompare(): number[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function toggleCompare(id: number): { list: number[]; added: boolean; full: boolean } {
  const list = getCompare();
  const i = list.indexOf(id);
  if (i >= 0) {
    list.splice(i, 1);
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(COMPARE_EVENT));
    return { list, added: false, full: false };
  }
  if (list.length >= MAX) return { list, added: false, full: true };
  list.push(id);
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(COMPARE_EVENT));
  return { list, added: true, full: false };
}

export function clearCompare() {
  localStorage.setItem(KEY, "[]");
  window.dispatchEvent(new Event(COMPARE_EVENT));
}

/* ------------------------- Recently viewed ------------------------- */
const RECENT_KEY = "eaccess_recent";

export function trackRecent(id: number) {
  if (typeof window === "undefined") return;
  try {
    const list: number[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    const next = [id, ...list.filter((x) => x !== id)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

export function getRecent(): number[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
