"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
        <nav className="pointer-events-auto flex items-center gap-2 rounded-full bg-neutral-950/95 py-1.5 pl-1.5 pr-1.5 shadow-xl shadow-black/20 backdrop-blur">
          <Link href="/" aria-label="E-Access home">
            <LogoMark size={34} />
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/90 transition hover:text-white"
          >
            {open ? <X size={16} /> : <Menu size={16} />} Home
          </button>
          <span className="h-1 w-1 rounded-full bg-white/40" />
          <Link
            href="/auth/login"
            className="btn-text flex items-center gap-1.5 rounded-full bg-support-blue px-4 py-2 text-white transition hover:brightness-110"
          >
            LOGIN <ArrowUpRight size={15} />
          </Link>
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
                ["Why us", "#why-us"],
                ["How e-access works", "#how-it-works"],
                ["Featured listings", "#featured"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
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
              href="/auth"
              className="btn-text mt-5 flex items-center justify-center gap-1.5 rounded-full bg-support-blue px-4 py-3 text-white"
            >
              Sign Up <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
