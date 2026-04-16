import type { Metadata } from "next";
import localFont from "next/font/local";

import { LanguageProvider } from "@/components/language-provider";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const sdaSans = localFont({
  src: [
    {
      path: "../../public/fonts/google-sans-variable-latin.woff2",
      style: "normal",
      weight: "100 700",
    },
  ],
  variable: "--font-sda-sans",
  display: "swap",
});

const sdaDisplay = localFont({
  src: [
    {
      path: "../../public/fonts/google-sans-display-400-latin.woff2",
      style: "normal",
      weight: "400",
    },
  ],
  variable: "--font-sda-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Synthetic Data Generator & Anonymizer",
  description: "Generate, anonymize, and synthesize tabular datasets through a modern interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${sdaSans.variable} ${sdaDisplay.variable}`}>
      <body>
        <LanguageProvider>
          <div className="app-shell">
            <SiteHeader />
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
