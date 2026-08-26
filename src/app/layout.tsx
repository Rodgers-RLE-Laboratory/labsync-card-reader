import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@labsync/design-system/styles.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LabSync Card Reader",
  description: "LabSync Card Reader",
  icons: {
    icon: "/favicon-96x96.png",
    apple: "/web-app-manifest-512x512.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
