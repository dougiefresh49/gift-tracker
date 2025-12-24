import "~/styles/globals.css";
import { type ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gift Tracker",
  description: "Track your family's Christmas gifts with ease",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo-icon.webp",
  },
  openGraph: {
    title: "Gift Tracker",
    description: "Track your family's Christmas gifts with ease",
    images: [
      {
        url: "/logo-full.webp",
        width: 1200,
        height: 630,
        alt: "Gift Tracker - Christmas stocking with G.T. logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gift Tracker",
    description: "Track your family's Christmas gifts with ease",
    images: ["/logo-full.webp"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

