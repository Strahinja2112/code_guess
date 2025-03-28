import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";

import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";

import { Kode_Mono } from "next/font/google";

const monoFont = Kode_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `Wordle For Programmers`,
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
          <ThemeProvider attribute="class" forcedTheme="dark">
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
