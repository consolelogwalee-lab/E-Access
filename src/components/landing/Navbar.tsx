"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { openConsultation } from "@/components/ConsultationHost";

const NAVY = "#1B1F4E";

export function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setLoggedIn(!!d.user)).catch(() => {});
  }, []);

  function goHome() {
    setOpen(false);
    if (window.location.pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
    else router.push("/");
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
        <nav className="pointer-events-auto flex items-center gap-3 rounded-full bg-neutral-950/95 py-1.5 pl-1.5 pr-1.5 shadow-xl shadow-black/20 backdrop-blur">
          <button onClick={goHome} aria-label="E-Access home">
            <LogoMark size={36} mono />
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full py-2 pl-3 pr-6 text-sm font-medium text-white/90 transition hover:text-white sm:pr-10"
          >
            {open ? <X size={16} /> : <Menu size={16} />} Home
          </button>
          <span className="h-1 w-1 rounded-full bg-white/40" />
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="btn-text flex items-center gap-1.5 rounded-full px-5 py-2.5 text-white transition hover:brightness-125"
              style={{ background: NAVY }}
            >
              DASHBOARD <ArrowUpRight size={15} />
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="btn-text flex items-center gap-1.5 rounded-full px-5 py-2.5 text-white transition hover:brightness-125"
              style={{ background: NAVY }}
            >
              LOGIN <ArrowUpRight size={15} />
            </Link>
          )}
        </nav>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 bg-neutral-950/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="mx-auto mt-20 w-[300px] rounded-3xl bg-neutral-950 p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              {[
                ["Browse listings", "/"],
                ["News & info center", "/news"],
                ["Verified agents", "/agents"],
                ["Speak to a consultant", loggedIn ? "#consult" : "/auth/login?next=%2Fdashboard%3Fconsult%3D1"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={(ev) => {
                    setOpen(false);
                    if (href === "#consult") { ev.preventDefault(); openConsultation(); }
                  }}
                  className="block rounded-xl px-4 py-3 text-[15px] font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="my-4 h-px bg-white/10" />
            <div className="flex flex-wrap gap-x-5 gap-y-2 px-4 text-xs text-white/50">
              <span>X (twitter)</span><span>Instagram</span><span>Whatsapp</span><span>Youtube</span>
            </div>
            <Link
              href={loggedIn ? "/dashboard" : "/auth"}
              className="btn-text mt-5 flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-white"
              style={{ background: NAVY }}
            >
              {loggedIn ? "Go to Dashboard" : "Sign Up"} <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
