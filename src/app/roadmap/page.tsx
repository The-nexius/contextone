import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Context One roadmap - See what's coming next. Vote on features, suggest improvements, and shape the future of unified AI memory.",
  keywords: ["Context One roadmap", "upcoming features", "feature requests", "product roadmap", "AI tools future"],
  openGraph: {
    title: "Roadmap | Context One",
    description: "See what's coming next and help shape the future of Context One.",
    url: "https://contextone.space/roadmap",
  },
};

const roadmap = {
  now: {
    title: "Now",
    description: "Currently in development",
    items: [
      { title: "Mobile App (iOS)", status: "in_progress", description: "Native iOS app for iPhone and iPad" },
      { title: "Mobile App (Android)", status: "in_progress", description: "Native Android app for phones and tablets" },
      { title: "Firefox Extension", status: "in_progress", description: "Firefox browser extension support" },
    ],
  },
  next: {
    title: "Next",
    description: "Coming soon",
    items: [
      { title: "Safari Extension", status: "planned", description: "Safari browser extension for Mac users" },
      { title: "Slack Integration", status: "planned", description: "Connect Context One to your Slack workspace" },
      { title: "Notion Integration", status: "planned", description: "Sync key decisions to Notion automatically" },
    ],
  },
  later: {
    title: "Later",
    description: "On our radar",
    items: [
      { title: "Voice AI Support", status: "planned", description: "Support for voice-based AI assistants" },
      { title: "API Webhooks", status: "planned", description: "Trigger actions based on conversation events" },
      { title: "Custom Embeddings", status: "planned", description: "Use your own embedding models" },
      { title: "Offline Mode", status: "planned", description: "Full functionality without internet connection" },
    ],
  },
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Product Roadmap
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
              See what's coming next and help shape the future of Context One.
            </p>
          </div>
        </div>
      </section>

      {/* Roadmap Board */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Now Column */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {roadmap.now.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {roadmap.now.description}
                </p>
              </div>
              <div className="space-y-4">
                {roadmap.now.items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-cyan-200 bg-white p-4 shadow-sm dark:border-cyan-800 dark:bg-gray-800"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                        In Progress
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Column */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {roadmap.next.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {roadmap.next.description}
                </p>
              </div>
              <div className="space-y-4">
                {roadmap.next.items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm dark:border-blue-800 dark:bg-gray-800"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        Planned
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Later Column */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {roadmap.later.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {roadmap.later.description}
                </p>
              </div>
              <div className="space-y-4">
                {roadmap.later.items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        Later
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Request Section */}
      <section className="bg-gray-50 py-20 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">
              Have a Feature Request?
            </h2>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
              We love hearing your ideas. Join our community to suggest features and vote on what matters most.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/community"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:shadow-lg hover:shadow-cyan-500/25"
              >
                Join Community
              </a>
              <a
                href="https://github.com/The-nexius/contextone"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}