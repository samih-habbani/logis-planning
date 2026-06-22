import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trainer Schedule — Logiscool UAE",
  description: "Trainer schedule management for Logiscool UAE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${geist.className} bg-neutral-950 text-neutral-100 min-h-full`}>
        {children}
      </body>
    </html>
  );
}
