import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Context One Privacy Policy - Learn how we collect, use, and protect your data. Your privacy is our top priority.",
  keywords: ["Context One privacy", "privacy policy", "data protection", "GDPR", "CCPA", "user data"],
  openGraph: {
    title: "Privacy Policy | Context One",
    description: "Our privacy policy explains how we protect your data.",
    url: "https://contextone.space/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
              Your privacy is our top priority. This policy explains how we collect, use, and protect your data.
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

            <h2>1. Introduction</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Context One (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our browser extension, web application, and API (collectively, the &quot;Service&quot;).
            </p>

            <h2>2. Information We Collect</h2>
            <h3>2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li>Account information (email, name) when you sign up</li>
              <li>Project names and descriptions you create</li>
              <li>Key decisions you manually save</li>
              <li>Feedback and support communications</li>
            </ul>

            <h3>2.2 Information Automatically Collected</h3>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li>Usage data (features used, frequency of use)</li>
              <li>Device and browser information</li>
              <li>Session statistics (contexts injected, messages captured)</li>
            </ul>

            <h3>2.3 Information from AI Tools</h3>
            <p className="text-gray-600 dark:text-gray-300">
              When you use our extension with AI tools (ChatGPT, Claude, Gemini, Perplexity, Grok), we may capture conversation context to provide our memory features. This data is encrypted and stored securely. We do not use this data for any purpose other than providing our Service.
            </p>

            <h2>3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To provide customer support</li>
              <li>To analyze usage patterns and improve our Service</li>
              <li>To detect, prevent, and address technical issues</li>
            </ul>

            <h2>4. Data Encryption & Security</h2>
            <p className="text-gray-600 dark:text-gray-300">
              We use industry-standard AES-256-GCM encryption to protect your data. For Pro users, all conversation data is encrypted client-side before transmission. We implement appropriate technical and organizational measures to ensure the security of your personal information.
            </p>

            <h2>5. Data Sharing</h2>
            <p className="text-gray-600 dark:text-gray-300">
              We do not sell, trade, or otherwise transfer your personal information to outside parties except as described below:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li><strong>Service Providers:</strong> We may share data with trusted third parties who assist in operating our Service (e.g., hosting, payment processing)</li>
              <li><strong>Legal Requirements:</strong> We may disclose information when required by law or in response to valid requests by public authorities</li>
            </ul>

            <h2>6. Your Rights</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Under GDPR and CCPA, you have the following rights:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Opt-out:</strong> Opt out of certain data collection</li>
            </ul>

            <h2>7. Data Retention</h2>
            <p className="text-gray-600 dark:text-gray-300">
              We retain your personal information only for as long as necessary to provide our Service and fulfill the purposes described in this policy. You can request deletion of your account and all associated data at any time.
            </p>

            <h2>8. Children&apos;s Privacy</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Our Service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
            </p>

            <h2>9. Changes to This Policy</h2>
            <p className="text-gray-600 dark:text-gray-300">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;last updated&quot; date.
            </p>

            <h2>10. Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-300">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              <strong>Email:</strong> privacy@contextone.space<br />
              <strong>Address:</strong> Context One, Inc.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}