import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Context One - Unified AI Memory",
  description: "Your AI tools finally remember everything. Context One provides persistent memory across ChatGPT, Claude, Gemini, Perplexity, and Grok.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        {children}
      </body>
    </html>
  );
}