import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Context One Cookie Policy - Learn how we use cookies and similar tracking technologies to improve your experience.",
  keywords: ["Context One cookies", "cookie policy", "tracking technologies", "data privacy"],
  openGraph: {
    title: "Cookie Policy | Context One",
    description: "How we use cookies to improve your experience.",
    url: "https://contextone.space/cookies",
  },
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Cookie Policy
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
              Learn how we use cookies and similar technologies to improve your experience.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl prose prose-lg dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300">
              <strong>Last updated:</strong> March 30, 2026
            </p>

            <h2>1. What Are Cookies?</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
            </p>

            <h2>2. How We Use Cookies</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Context One uses cookies and similar tracking technologies for the following purposes:
            </p>

            <h3>2.1 Essential Cookies</h3>
            <p className="text-gray-600 dark:text-gray-300">
              These cookies are necessary for the Service to function properly. They enable:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li>Authentication and security</li>
              <li>Remembering your preferences</li>
              <li>Load balancing and performance optimization</li>
            </ul>

            <h3>2.2 Functional Cookies</h3>
            <p className="text-gray-600 dark:text-gray-300">
              These cookies enable enhanced functionality and personalization, such as:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li>Remembering your settings and preferences</li>
              <li>Providing personalized content</li>
              <li>Enabling social media features</li>
            </ul>

            <h3>2.3 Analytics Cookies</h3>
            <p className="text-gray-600 dark:text-gray-300">
              These cookies help us understand how visitors interact with our Service by:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li>Tracking page views and traffic sources</li>
              <li>Understanding which features are most popular</li>
              <li>Helping us improve the Service</li>
            </ul>

            <h2>3. Types of Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-700">Cookie Type</th>
                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-700">Purpose</th>
                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-700">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">session</td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">Authentication</td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">Session</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">preferences</td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">User settings</td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">1 year</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">analytics</td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">Usage analytics</td>
                    <td className="border border-gray-200 px-4 py-2 dark:border-gray-700">2 years</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>4. Managing Cookies</h2>
            <p className="text-gray-600 dark:text-gray-300">
              You can control and/or delete cookies as you wish. You can:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li>Delete all cookies already on your device</li>
              <li>Set most browsers to block cookies</li>
              <li>Configure browser settings to notify you when cookies are placed</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300">
              Please note that if you block or delete cookies, some features of the Service may not work properly.
            </p>

            <h2>5. Third-Party Cookies</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Some third-party services may also place cookies on your device, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li><strong>Analytics:</strong> Google Analytics for usage statistics</li>
              <li><strong>Payments:</strong> Stripe for secure payment processing</li>
              <li><strong>Authentication:</strong> Supabase for user authentication</li>
            </ul>

            <h2>6. Updates to This Policy</h2>
            <p className="text-gray-600 dark:text-gray-300">
              We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>

            <h2>7. Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-300">
              If you have any questions about our use of cookies, please contact us at:
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              <strong>Email:</strong> privacy@contextone.space
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}