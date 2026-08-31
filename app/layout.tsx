import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pete Noir — photographs from the Heaphy, printed",
  description:
    "Limited edition prints from Kahurangi National Park and the West Coast. Made at the lab nearest you.",
  authors: [{ name: "2701kai" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Karla:ital,wght@0,300..700;1,300..600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
