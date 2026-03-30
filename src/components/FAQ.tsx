const faqs = [
  {
    question: "How does Context One work?",
    answer: "Context One is a browser extension that sits between you and your AI tools. When you type a message, it searches your unified memory and injects relevant past context into the prompt automatically.",
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. For Pro users, all data is encrypted locally with AES-256-GCM before being uploaded to our servers. We never see your actual conversations - only encrypted blobs.",
  },
  {
    question: "Does it work on mobile?",
    answer: "Currently, Context One is available as a Chrome extension for desktop. Mobile support is on our roadmap for Phase 2.",
  },
  {
    question: "Can I use it for free?",
    answer: "Yes! The Free tier includes 1 project, local storage, and basic context injection. Perfect for personal use.",
  },
  {
    question: "What AI tools are supported?",
    answer: "We support ChatGPT, Claude, Gemini, Perplexity, and Grok. These 5 tools cover approximately 99% of all AI assistant users.",
  },
];

export default function FAQ() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mb-12 text-lg text-gray-600 dark:text-gray-300">
            Everything you need to know about Context One.
          </p>
        </div>
        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
            >
              <h3 className="mb-2 text-lg font-semibold">{faq.question}</h3>
              <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}