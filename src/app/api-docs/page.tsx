import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation",
  description: "Context One API documentation - Programmatic access to manage projects, conversations, and context. REST API with authentication, rate limiting, and webhooks.",
  keywords: ["Context One API", "API documentation", "REST API", "developer API", "context injection API", "programmatic access"],
  openGraph: {
    title: "API Documentation | Context One",
    description: "Programmatic access to Context One for developers.",
    url: "https://contextone.space/api-docs",
  },
};

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/auth/verify",
    description: "Verify the current user's authentication token",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/v1/projects",
    description: "List all projects for the authenticated user",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/v1/projects",
    description: "Create a new project",
    auth: true,
  },
  {
    method: "PUT",
    path: "/api/v1/projects/{id}",
    description: "Update an existing project",
    auth: true,
  },
  {
    method: "DELETE",
    path: "/api/v1/projects/{id}",
    description: "Delete a project and all associated data",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/v1/conversations",
    description: "List conversations, optionally filtered by project",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/v1/conversations",
    description: "Create or save a conversation",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/v1/conversations/{id}",
    description: "Get a specific conversation with all messages",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/v1/context/search",
    description: "Search across all conversations for relevant context",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/v1/context/inject",
    description: "Get context to inject into an AI tool",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/v1/context/capture",
    description: "Capture a conversation turn for future context",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/v1/context/decisions",
    description: "List key decisions for a project",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/v1/context/decisions",
    description: "Create a key decision",
    auth: true,
  },
];

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              API Documentation
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
              Programmatic access to Context One. Build integrations and automate workflows.
            </p>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-semibold">Base URL</h2>
              <code className="rounded bg-gray-800 px-3 py-1 text-sm text-cyan-400">
                https://api.contextone.space/v1
              </code>
            </div>

            <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-semibold">Authentication</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                All API endpoints require authentication via a JWT token. Include the token in the Authorization header:
              </p>
              <code className="block rounded bg-gray-800 px-3 py-2 text-sm text-cyan-400">
                Authorization: Bearer YOUR_JWT_TOKEN
              </code>
            </div>

            <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-semibold">Rate Limiting</h2>
              <p className="text-gray-600 dark:text-gray-300">
                API requests are limited to 100 requests per minute per user. Pro and Team plans have higher limits.
              </p>
            </div>

            <h2 className="mb-6 text-2xl font-bold">Endpoints</h2>
            
            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <span className={`rounded px-2 py-1 text-xs font-bold ${
                      endpoint.method === "GET" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                      endpoint.method === "POST" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                      endpoint.method === "PUT" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                      "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-gray-900 dark:text-white">
                      {endpoint.path}
                    </code>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {endpoint.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="bg-gray-50 py-20 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-2xl font-bold">Code Examples</h2>
            
            <div className="rounded-xl border border-gray-200 bg-gray-900 p-6 dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-white">cURL</h3>
              <pre className="overflow-x-auto text-sm text-gray-300">
{`# Verify authentication
curl -X GET https://api.contextone.space/v1/auth/verify \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# List projects
curl -X GET https://api.contextone.space/v1/projects \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search context
curl -X POST https://api.contextone.space/v1/context/search \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "What was my previous project about?"}'`}
              </pre>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-900 p-6 dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-white">JavaScript</h3>
              <pre className="overflow-x-auto text-sm text-gray-300">
{`const response = await fetch('https://api.contextone.space/v1/projects', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
});
const projects = await response.json();`}
              </pre>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-900 p-6 dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-white">Python</h3>
              <pre className="overflow-x-auto text-sm text-gray-300">
{`import requests

headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.contextone.space/v1/projects',
    headers=headers
)
projects = response.json()`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">
              Need Help?
            </h2>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
              Join our developer community for API support and integration help.
            </p>
            <a
              href="/community"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:shadow-lg hover:shadow-cyan-500/25"
            >
              Join Community
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}