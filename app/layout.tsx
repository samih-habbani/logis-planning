import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Planning Formateurs — Logiscool UAE",
  description: "Gestion des emplois du temps pour les formateurs Logiscool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark h-full">
      <body className={`${geist.className} bg-neutral-950 text-neutral-100 min-h-full`}>
        {children}
      </body>
    </html>
  );
}
