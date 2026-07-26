import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Nest PG — Admin",
  description: "Manage rooms, beds, guests and payments for your PG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
