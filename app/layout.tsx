import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GrappleGuide",
  description: "주짓수 기술 카드",
  appleWebApp: {
    capable: true,
    title: "GrappleGuide",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e293b",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-surface-sunken text-foreground flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
