import "~/styles/globals.css";
import { type ReactNode } from "react";

export const metadata = {
  title: "Christmas Gift Tracker",
  description: "Track your family's Christmas gifts",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

