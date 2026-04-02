import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description: "Context One blog - Latest articles on AI productivity, tips, tutorials, and news. Learn how to get the most out of your AI tools.",
  keywords: ["Context One blog", "AI productivity", "AI tips", "tutorials", "ChatGPT tips", "Claude tips", "AI news"],
  openGraph: {
    title: "Blog | Context One",
    description: "Latest articles on AI productivity and tips.",
    url: "https://contextone.space/blog",
  },
};

const posts = [
  {
    title: "Why Your AI Tools Don't Remember Anything",
    excerpt: "The hidden cost of switching between AI assistants and how unified memory solves this problem.",
    date: "March 30, 2026",
    category: "Product",
    readTime: "5 min read",
    slug: "why-ai-tools-dont-remember",
  },
  {
    title: "10 ChatGPT Tips for Power Users",
    excerpt: "Get more out of ChatGPT with these advanced tips and techniques.",
    date: "March 28, 2026",
    category: "Tutorial",
    readTime: "8 min read",
    slug: "chatgpt-tips-power-users",
  },
  {
    title: "The Future of AI: Unified Memory",
    excerpt: "How memory technology is transforming AI assistants from stateless tools to persistent partners.",
    date: "March 25, 2026",
    category: "Opinion",
    readTime: "6 min read",
    slug: "future-of-ai-unified-memory",
  },
  {
    title: "Getting Started with Context One",
    excerpt: "A step-by-step guide to setting up and using Context One for the first time.",
    date: "March 20, 2026",
    category: "Tutorial",
    readTime: "10 min read",
    slug: "getting-started-context-one",
  },
  {
    title: "How Semantic Search Works",
    excerpt: "Understanding the technology behind Context One's intelligent context retrieval.",
    date: "March 15, 2026",
    category: "Technology",
    readTime: "7 min read",
    slug: "how-semantic-search-works",
  },
  {
    title: "Building Better AI Prompts",
    excerpt: "Learn how to write prompts that get better results from AI assistants.",
    date: "March 10, 2026",
    category: "Tutorial",
    readTime: "6 min read",
    slug: "building-better-ai-prompts",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Blog
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
              Latest insights on AI productivity, tips, and news.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <a
                href={`/blog/${post.slug}`}
                key={index}
                className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-cyan-500 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex-1 p-6">
                  <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="rounded-full bg-cyan-100 px-2 py-1 font-medium text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                      {post.category}
                    </span>
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="mb-3 text-xl font-semibold text-gray-900 transition-colors group-hover:text-cyan-500 dark:text-white">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {post.excerpt}
                  </p>
                </div>
                <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                  <span className="text-sm font-medium text-cyan-500 transition-colors group-hover:text-cyan-400">
                    Read more →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-gray-50 py-20 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">
              Subscribe to Our Newsletter
            </h2>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
              Get the latest articles and tips delivered to your inbox.
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