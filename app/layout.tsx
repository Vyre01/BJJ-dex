import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

// Body + UI — covers Korean and Latin with real character (not Arial/Inter).
// preload:false avoids requiring a Korean subset preload tag.
const sansKr = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-kr",
  display: "swap",
  preload: false,
});

// Display — athletic grotesque for the wordmark and headings.
const display = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GrappleGuide",
  description: "주짓수 기술 카드",
  appleWebApp: {
    capable: true,
    title: "GrappleGuide",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e14",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${sansKr.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-screen text-foreground flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
