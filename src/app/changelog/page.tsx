import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Context One changelog - See the latest updates, new features, and improvements. Stay up to date with our regular releases.",
  keywords: ["Context One changelog", "release notes", "new features", "updates", "version history"],
  openGraph: {
    title: "Changelog | Context One",
    description: "See the latest updates and new features in Context One.",
    url: "https://contextone.space/changelog",
  },
};

const changes = [
  {
    version: "1.0.0",
    date: "March 30, 2026",
    type: "major",
    title: "Initial Release",
    description: "We're excited to launch Context One! This release includes all core features to get you started with unified AI memory.",
    changes: [
      "Unified memory across ChatGPT, Claude, Gemini, Perplexity, and Grok",
      "Chrome extension with context injection",
      "Project organization and management",
      "Semantic search across all conversations",
      "Key decisions extraction",
      "Free forever plan for personal use",
      "Pro plan with encrypted cloud sync",
      "Team plan for collaboration",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Changelog
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
              Stay up to date with the latest features, improvements, and fixes.
            </p>
          </div>
        </div>
      </section>

      {/* Changelog Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700 md:left-1/2"></div>

              {changes.map((change, index) => (
                <div key={index} className="relative mb-12 last:mb-0">
                  {/* Version badge */}
                  <div className="absolute left-4 top-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1 text-sm font-semibold text-white md:left-1/2">
                    v{change.version}
                  </div>

                  {/* Content */}
                  <div className="ml-16 md:ml-0 md:w-1/2 md:pr-12">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {change.date}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          change.type === "major" 
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                            : change.type === "minor"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                          {change.type}
                        </span>
                      </div>
                      <h3 className="mb-3 text-xl font-semibold">
                        {change.title}
                      </h3>
                      <p className="mb-4 text-gray-600 dark:text-gray-300">
                        {change.description}
                      </p>
                      <ul className="space-y-2">
                        {change.changes.map((item, i) => (
                          <li key={i} className="flex items-start text-sm">
                            <svg
                              className="mr-2 h-5 w-5 flex-shrink-0 text-cyan-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-gray-600 dark:text-gray-300">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="bg-gray-50 py-20 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">
              Get Notified of Updates
            </h2>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
              Subscribe to our newsletter to get the latest features delivered to your inbox.
            </p>
            <form className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:shadow-lg hover:shadow-cyan-500/25"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}