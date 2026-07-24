import type { Metadata } from "next";
import "./globals.css";
import StoreProvider from "./providers";

export const metadata: Metadata = {
  title: "Deutsch Learning Helper",
  description: "Build and review your German vocabulary.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><StoreProvider>{children}</StoreProvider></body>
    </html>
  );
}
