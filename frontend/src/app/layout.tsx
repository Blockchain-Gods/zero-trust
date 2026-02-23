import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  weight: ["200", "400", "700"],
});

export const metadata: Metadata = {
  title: "Zero Trust",
  description: "Asymmetric ZK Security Game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${ibmPlexMono.variable} antialiased dark`}
      >
        <Header />
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
