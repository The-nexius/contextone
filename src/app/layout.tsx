import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Context One - Unified AI Memory",
    template: "%s | Context One",
  },
  description: "Your AI tools finally remember everything. Context One provides persistent memory across ChatGPT, Claude, Gemini, Perplexity, and Grok.",
  keywords: ["AI memory", "unified AI", "persistent context", "ChatGPT memory", "Claude memory", "AI assistant", "productivity"],
  authors: [{ name: "Context One" }],
  creator: "Context One",
  publisher: "Context One",
  metadataBase: new URL("https://contextone.space"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://contextone.space",
    siteName: "Context One",
    title: "Context One - Unified AI Memory",
    description: "Your AI tools finally remember everything. Context One provides persistent memory across ChatGPT, Claude, Gemini, Perplexity, and Grok.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Context One - Unified AI Memory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Context One - Unified AI Memory",
    description: "Your AI tools finally remember everything. Context One provides persistent memory across ChatGPT, Claude, Gemini, Perplexity, and Grok.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
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
        <Header />
        <main className="flex-1 pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}