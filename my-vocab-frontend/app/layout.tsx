import type { Metadata } from "next";
import "./globals.css";
import StoreProvider from "./providers";

export const metadata: Metadata = {
  title: "Deutsch Learning With Mishrat",
  description: "Learn German vocabulary with Mishrat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <StoreProvider>{children}</StoreProvider>
        <a
          href="https://wa.me/8801972521141"
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-950/25 transition-transform hover:scale-110 focus:outline-hidden focus:ring-4 focus:ring-emerald-300 sm:bottom-6 sm:right-6"
        >
          <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8 fill-current">
            <path d="M16 3.1a12.8 12.8 0 0 0-10.9 19.5L3.6 28l5.6-1.5A12.9 12.9 0 1 0 16 3.1Zm0 23.4a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-3.3.9.9-3.2-.2-.4A10.6 10.6 0 1 1 16 26.5Zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-.9 1.2-.4.3-.7.1a8.7 8.7 0 0 1-2.6-1.6 9.7 9.7 0 0 1-1.8-2.3c-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6s0-.5-.1-.7l-1-2.3c-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.7.1-1 .5s-1.4 1.4-1.4 3.4 1.4 3.9 1.6 4.2a12.2 12.2 0 0 0 4.7 4.3c.7.3 1.3.6 1.8.7.8.3 1.5.2 2 .1.6-.1 1.9-.8 2.1-1.5s.3-1.4.2-1.5-.3-.2-.6-.4Z" />
          </svg>
        </a>
      </body>
    </html>
  );
}
