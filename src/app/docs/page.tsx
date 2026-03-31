import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Context One documentation - Learn how to set up and use Context One. Get started with the Chrome extension, configure projects, and maximize your AI productivity.",
  keywords: ["Context One documentation", "getting started", "Chrome extension setup", "tutorial", "how to use", "AI productivity guide"],
  openGraph: {
    title: "Documentation | Context One",
    description: "Learn how to set up and use Context One to get the most out of your AI tools.",
    url: "https://contextone.space/docs",
  },
};

const guides = [
  {
    title: "Getting Started",
    description: "Set up Context One in minutes",
    href: "#getting-started",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Chrome Extension",
    description: "Install and configure the browser extension",
    href: "#chrome-extension",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Projects & Organization",
    description: "Organize your conversations by project",
    href: "#projects",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    title: "Context Injection",
    description: "How context injection works",
    href: "#context-injection",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: "Security & Encryption",
    description: "Understanding our security model",
    href: "#security",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: "API Reference",
    description: "Programmatic access to Context One",
    href: "/api-docs",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Documentation
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
              Everything you need to know about setting up and using Context One.
            </p>
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide, index) => (
              <Link
                key={index}
                href={guide.href}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-cyan-500 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 transition-colors group-hover:bg-cyan-500 group-hover:text-white dark:bg-cyan-900 dark:text-cyan-400">
                  {guide.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {guide.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {guide.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section id="getting-started" className="bg-gray-50 py-20 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-3xl font-bold tracking-tight">Getting Started</h2>
            
            <div className="space-y-8">
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 text-xl font-semibold">1. Create an Account</h3>
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  Sign up for a free account at <Link href="/signup" className="text-cyan-500 hover:underline">contextone.space/signup</Link>. 
                  No credit card required for the free plan.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 text-xl font-semibold">2. Install the Chrome Extension</h3>
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  Download the extension from the Chrome Web Store. Once installed, you'll see the Context One icon in your browser toolbar.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 text-xl font-semibold">3. Sign In to the Extension</h3>
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  Click the Context One icon in your browser and sign in with your account. The extension will automatically start capturing context from supported AI tools.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 text-xl font-semibold">4. Start Chatting</h3>
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  That's it! Start using ChatGPT, Claude, Gemini, Perplexity, or Grok. Context One will automatically remember your conversations and provide relevant context when you need it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">
              Need More Help?
            </h2>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
              Can't find what you're looking for? Our community is here to help.
            </p>
            <Link
              href="/community"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:shadow-lg hover:shadow-cyan-500/25"
            >
              Join Community
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}