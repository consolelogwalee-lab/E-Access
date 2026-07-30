import { Navbar } from "@/components/landing/Navbar";
import { LogoFull } from "@/components/Logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-[760px] px-6 pb-20 pt-28">{children}</div>
      <footer className="bg-[#04040a] py-10 text-center">
        <div className="flex justify-center"><LogoFull /></div>
        <p className="mt-4 text-xs text-white/40">© 2026 E-Access. All rights reserved.</p>
      </footer>
    </main>
  );
}
