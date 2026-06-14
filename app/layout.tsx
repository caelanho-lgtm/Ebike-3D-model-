import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VeloFit Enterprise",
  description:
    "Multi-tenant bicycle fitting, 3D visualization, and AI sizing infrastructure for brands and retailers.",
  applicationName: "VeloFit Enterprise",
  metadataBase: new URL("https://velofit.example.com")
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
