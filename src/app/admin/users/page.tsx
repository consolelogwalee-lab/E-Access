"use client";
import { useCallback, useEffect, useState } from "react";
import { timeAgo } from "@/lib/format";

type AdminUser = {
  id: number; full_name: string; email: string; email_verified: number; avatar_color: string;
  role: string; created_at: string; listing_count: number | string; inquiry_count: number | string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.users ?? []));
  }, []);
  useEffect(load, [load]);

  async function setRole(id: number, role: string) {
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    const d = await res.json();
    if (!res.ok) setError(d.error ?? "Failed.");
    load();
  }

  return (
    <div>
      <h1 className="h3 text-neutral-900">Users</h1>
      <p className="body-md text-neutral-400">{users?.length ?? "…"} registered accounts.</p>
      {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs text-neutral-400">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Verified</th>
              <th className="px-4 py-3 font-medium">Listings</th>
              <th className="px-4 py-3 font-medium">Inquiries</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {(users ?? []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: u.avatar_color }}>
                      {u.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-neutral-800">{u.full_name}</div>
                      <div className="truncate text-xs text-neutral-400">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {Number(u.email_verified) ? (
                    <span className="rounded-full bg-lime-100 px-2.5 py-0.5 text-[11px] font-semibold text-lime-600">Verified</span>
                  ) : (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-500">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-700">{Number(u.listing_count)}</td>
                <td className="px-4 py-3 text-neutral-700">{Number(u.inquiry_count)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">{timeAgo(u.created_at)}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => setRole(u.id, e.target.value)}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none ${
                      u.role === "admin" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-neutral-200 bg-neutral-50 text-neutral-600"
                    }`}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
