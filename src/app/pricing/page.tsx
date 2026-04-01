import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Context One pricing: Free forever with local semantic search, Pro at $9/month with encrypted cloud sync. Start free, upgrade anytime.",
  keywords: ["Context One pricing", "AI memory pricing", "free AI tools", "Pro subscription", "local embeddings", "semantic search"],
  openGraph: {
    title: "Pricing | Context One",
    description: "Free forever with local semantic search. Pro $9/month with encrypted cloud sync.",
    url: "https://contextone.space/pricing",
  },
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for personal use",
    features: [
      "Unlimited message capture",
      "Local semantic search (Transformers.js)",
      "All 5 AI tools supported",
      "1 project",
      "100 message history",
      "Single device only",
      "Chrome extension",
    ],
    cta: "Get Started",
    href: "/signup",
    popular: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For power users who need more",
    features: [
      "Everything in Free",
      "Cloud sync across devices",
      "Unlimited projects",
      "Unlimited message history",
      "Advanced semantic search (pgvector)",
      "Master key encryption",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/signup",
    popular: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    description: "For teams and businesses",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared workspaces",
      "Team analytics",
      "Admin controls",
      "Dedicated support",
      "SSO integration",
      "Custom SLA",
    ],
    cta: "Contact Sales",
    href: "/community",
    popular: false,
  },
];

const faqs = [
  {
    question: "Can I use Context One for free?",
    answer: "Yes! The Free plan gives you unlimited personal use with local storage. No credit card required, no time limit.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards through Stripe. For Team plans, we can also invoice via wire transfer.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. Cancel anytime from your dashboard. Your data remains accessible for 30 days after cancellation.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes. We use AES-256-GCM encryption. For Pro users, your data is encrypted client-side before it leaves your device. We have zero knowledge of your conversation content.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 14-day money-back guarantee for Pro subscriptions. No questions asked.",
  },
  {
    question: "Can I switch plans later?",
    answer: "Yes! Upgrade or downgrade anytime. When upgrading, you get immediate access to new features. When downgrading, you keep access until your billing period ends.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Simple, Transparent{" "}
              <span className="text-cyan-500">Pricing</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
              Start free, upgrade when you need more. No hidden fees, no surprises.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 shadow-lg ${
                  plan.popular
                    ? "border-cyan-500 bg-white dark:bg-gray-800"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="mb-2 text-xl font-semibold">{plan.name}</h3>
                <div className="mb-2 flex items-baseline">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                  {plan.description}
                </p>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <svg
                        className="mr-3 h-5 w-5 text-cyan-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full rounded-lg py-3 text-center font-semibold transition-colors ${
                    plan.popular
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-20 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
                >
                  <h3 className="mb-2 text-lg font-semibold">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">
              Still Have Questions?
            </h2>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
              Can't find the answer you're looking for? Chat with our team.
            </p>
            <Link
              href="/community"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}