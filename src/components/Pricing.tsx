const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for personal use",
    features: [
      "1 project",
      "Local storage only",
      "Basic context injection",
      "Chrome extension",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$15",
    period: "/month",
    description: "For power users",
    features: [
      "Unlimited projects",
      "Encrypted cloud sync",
      "Advanced semantic search",
      "Priority support",
      "API access",
      "Cross-device sync",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Team",
    price: "$39",
    period: "/month",
    description: "For teams and businesses",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared workspaces",
      "Team analytics",
      "Admin controls",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mb-12 text-lg text-gray-600 dark:text-gray-300">
            Start free, upgrade when you need more.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 shadow-lg ${
                plan.popular
                  ? "border-blue-500 bg-white dark:bg-gray-900"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-4 py-1 text-sm font-semibold text-white">
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
                      className="mr-3 h-5 w-5 text-green-500"
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
              <a
                href="#"
                className={`block w-full rounded-lg py-3 text-center font-semibold transition-colors ${
                  plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}