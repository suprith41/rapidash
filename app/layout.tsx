import type { Metadata } from "next";
import localFont from "next/font/local";
import ErrorBoundary from "@/components/ErrorBoundary";
import SmokeTestPanel from "@/components/SmokeTestPanel";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Raidash",
  description: "Privacy-first wealth tracking for Indian investors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
        <SmokeTestPanel />
      </body>
    </html>
  );
}
