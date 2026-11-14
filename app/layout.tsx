import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Musim - Field Shift Malaysia",
  description:
    "Explore climate-resilient crop rotations using NASA Earth observations and local farm priorities.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full font-sans antialiased", inter.variable)}>
      <head>
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
        <link rel="preconnect" href="https://gibs.earthdata.nasa.gov" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
