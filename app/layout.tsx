import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const nunito = localFont({
  src: "../public/fonts/Nunito-Regular.otf",
  variable: "--font-nunito",
  weight: "400",
  display: "swap",
});

const bebasNeue = localFont({
  src: "../public/fonts/BebasNeue-Regular.otf",
  variable: "--font-bebas-neue",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Musim — Field Shift Malaysia",
  description:
    "Explore climate-resilient crop rotations using NASA Earth observations and local farm priorities.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
        <link rel="preconnect" href="https://gibs.earthdata.nasa.gov" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
