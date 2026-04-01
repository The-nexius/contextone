"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const navigation = {
  product: [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Changelog", href: "/changelog" },
    { name: "Roadmap", href: "/roadmap" },
  ],
  resources: [
    { name: "Documentation", href: "/docs" },
    { name: "API", href: "/api-docs" },
    { name: "Blog", href: "/blog" },
    { name: "Community", href: "/community" },
  ],
  legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Cookies", href: "/cookies" },
  ],
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!session || !!token);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!session || !!token);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user');
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) => pathname === href;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-bold text-white">
            C
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Context One
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {/* Product Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProductOpen(!productOpen)}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                isActive("/features") || isActive("/pricing") || isActive("/changelog") || isActive("/roadmap")
                  ? "text-cyan-500"
                  : "text-gray-700 hover:text-cyan-500 dark:text-gray-300"
              }`}
            >
              Product
              <svg
                className={`h-4 w-4 transition-transform ${productOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {productOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {navigation.product.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setProductOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-cyan-500 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Resources Dropdown */}
          <div className="relative">
            <button
              onClick={() => setResourcesOpen(!resourcesOpen)}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                isActive("/docs") || isActive("/api-docs") || isActive("/blog") || isActive("/community")
                  ? "text-cyan-500"
                  : "text-gray-700 hover:text-cyan-500 dark:text-gray-300"
              }`}
            >
              Resources
              <svg
                className={`h-4 w-4 transition-transform ${resourcesOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {resourcesOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {navigation.resources.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setResourcesOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-cyan-500 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Direct Links */}
          <Link
            href="/blog"
            className={`text-sm font-medium transition-colors ${
              isActive("/blog") ? "text-cyan-500" : "text-gray-700 hover:text-cyan-500 dark:text-gray-300"
            }`}
          >
            Blog
          </Link>
        </div>

        {/* Auth Buttons - Show based on auth state */}
        <div className="hidden items-center gap-4 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-700 hover:text-cyan-500 dark:text-gray-300"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-700 hover:text-cyan-500 dark:text-gray-300"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-cyan-500 dark:text-gray-300"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-cyan-500/25"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-700 dark:text-gray-300"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900 md:hidden">
          <div className="space-y-4">
            {/* Product Section */}
            <div>
              <button
                onClick={() => setProductOpen(!productOpen)}
                className="flex w-full items-center justify-between py-2 text-base font-medium text-gray-700 dark:text-gray-300"
              >
                Product
                <svg
                  className={`h-5 w-5 transition-transform ${productOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {productOpen && (
                <div className="mt-2 space-y-2 pl-4">
                  {navigation.product.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Resources Section */}
            <div>
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                className="flex w-full items-center justify-between py-2 text-base font-medium text-gray-700 dark:text-gray-300"
              >
                Resources
                <svg
                  className={`h-5 w-5 transition-transform ${resourcesOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {resourcesOpen && (
                <div className="mt-2 space-y-2 pl-4">
                  {navigation.resources.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Links - Mobile */}
            <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-base font-medium text-gray-700 dark:text-gray-300"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block py-2 text-base font-medium text-gray-700 dark:text-gray-300"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-base font-medium text-gray-700 dark:text-gray-300"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-center text-base font-medium text-white"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}