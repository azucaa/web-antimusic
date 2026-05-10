import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/common/AppShell";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AntiMusic — Local-First, Distraction-Free Web Music Player",
  description: "A premium, algorithm-free music streamer that keeps you in control. Listen to songs, customize local playlists, schedule focus sessions, and track listening metrics safely.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased scrollbar-none">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} min-h-full bg-[#09070f] font-sans antialiased text-[#f4f2f7] overflow-y-auto`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
