import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-12 dark:border-gray-700 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold">Context One</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your AI tools finally remember everything. Unified memory across all your AI assistants.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/features" className="hover:text-cyan-500">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-cyan-500">Pricing</Link></li>
              <li><Link href="/changelog" className="hover:text-cyan-500">Changelog</Link></li>
              <li><Link href="/roadmap" className="hover:text-cyan-500">Roadmap</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/docs" className="hover:text-cyan-500">Documentation</Link></li>
              <li><Link href="/api-docs" className="hover:text-cyan-500">API</Link></li>
              <li><Link href="/blog" className="hover:text-cyan-500">Blog</Link></li>
              <li><Link href="/community" className="hover:text-cyan-500">Community</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/privacy" className="hover:text-cyan-500">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-cyan-500">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-cyan-500">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          © {new Date().getFullYear()} Context One. All rights reserved.
        </div>
      </div>
    </footer>
  );
}