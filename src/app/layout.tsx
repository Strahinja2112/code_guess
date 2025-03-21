import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/lib/config";
import "@/styles/globals.css";

import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";

import { DM_Mono, Kode_Mono } from "next/font/google";

const monoFont = Kode_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: `${siteConfig.name} - Wordle For Programmers`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${monoFont.variable} ${monoFont.className}`}
      suppressHydrationWarning
    >
      <body className="bg-[#090909]">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
