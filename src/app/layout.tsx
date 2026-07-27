import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-Access — Real Land. Real Owners. Real Peace of Mind.",
  description:
    "Access verified estates from trusted developers, complete with document validation, inspection support, and secure transaction guidance all in one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
