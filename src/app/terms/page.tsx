import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Context One Terms of Service - Read our terms and conditions for using the Context One browser extension and web application.",
  keywords: ["Context One terms", "terms of service", "conditions", "user agreement", "legal"],
  openGraph: {
    title: "Terms of Service | Context One",
    description: "Terms and conditions for using Context One.",
    url: "https://contextone.space/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
              Please read these terms carefully before using Context One.
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

            <h2>1. Acceptance of Terms</h2>
            <p className="text-gray-600 dark:text-gray-300">
              By accessing and using Context One (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this Service.
            </p>

            <h2>2. Description of Service</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Context One is a browser extension and web application that provides unified, persistent memory across various AI assistant tools. The Service includes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li>Browser extension for Chrome and other browsers</li>
              <li>Web dashboard for managing projects and settings</li>
              <li>API for programmatic access</li>
              <li>Cloud sync for Pro and Team subscribers</li>
            </ul>

            <h2>3. User Accounts</h2>
            <p className="text-gray-600 dark:text-gray-300">
              To use the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update any changes to your information</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h2>4. Acceptable Use</h2>
            <p className="text-gray-600 dark:text-gray-300">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Transmit any viruses or malicious code</li>
              <li>Collect or store personal data about other users without consent</li>
            </ul>

            <h2>5. Intellectual Property</h2>
            <p className="text-gray-600 dark:text-gray-300">
              The Service and its original content, features, and functionality are owned by Context One, Inc. and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h2>6. Subscription & Payment</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Some features of the Service require a paid subscription. By subscribing, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li>Provide valid payment information</li>
              <li>Pay the subscription fees for your selected plan</li>
              <li>Allow us to process recurring payments</li>
              <li>Notify us of any changes to your payment information</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300">
              Subscription fees are non-refundable except as explicitly stated in our refund policy.
            </p>

            <h2>7. Termination</h2>
            <p className="text-gray-600 dark:text-gray-300">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>

            <h2>8. Limitation of Liability</h2>
            <p className="text-gray-600 dark:text-gray-300">
              In no event shall Context One, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li>Your use or inability to use the Service</li>
              <li>Any unauthorized access to or use of our servers</li>
              <li>Any interruption or cessation of the Service</li>
              <li>Any bugs, viruses, or similar harmful code</li>
            </ul>

            <h2>9. Disclaimer</h2>
            <p className="text-gray-600 dark:text-gray-300">
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>

            <h2>10. Governing Law</h2>
            <p className="text-gray-600 dark:text-gray-300">
              These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
            </p>

            <h2>11. Changes to Terms</h2>
            <p className="text-gray-600 dark:text-gray-300">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any significant changes.
            </p>

            <h2>12. Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-300">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              <strong>Email:</strong> legal@contextone.space<br />
              <strong>Address:</strong> Context One, Inc.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}