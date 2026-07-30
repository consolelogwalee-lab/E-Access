import type { Metadata } from "next";
import "./globals.css";
import { UiHost } from "@/components/Ui";

export const metadata: Metadata = {
  title: "E-Access | Real Land. Real Owners. Real Peace of Mind.",
  description:
    "A reliable hub for verified properties across Nigeria. Land. Property. Possibilities. Document validation, inspection support, and secure transaction guidance in one platform, by T-Prime Development.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        <UiHost />
      </body>
    </html>
  );
}
