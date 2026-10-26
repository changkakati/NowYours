
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessToken, getStoredUser } from "@/lib/auth";

const navLinks = [
  { label: "Explore", href: "/listings" },
  { label: "My listings", href: "/listings/mine" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    function syncAuth() {
      const token = getAccessToken();
      setLoggedIn(Boolean(token));
      setUser(token ? getStoredUser() : null);
    }

    syncAuth();
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
    };
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href) => {
    if (href === "/listings") {
      return pathname === "/listings";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const displayName =
    user?.full_name ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Account";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        {/* Logo */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="NowYours home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-lg font-bold text-white transition-transform group-hover:rotate-[-6deg]">
            N
          </span>

          <span className="text-xl font-bold tracking-tight text-gray-950">
            now<span className="text-gray-400">yours</span>
            <span className="ml-1 text-black">.</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition ${
                isActive(link.href)
                  ? "font-semibold text-black"
                  : "font-medium text-gray-500 hover:text-black"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop account actions */}
        <div className="hidden items-center gap-3 md:flex">
          {loggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="max-w-32 truncate px-3 py-2 text-sm font-medium text-gray-600 transition hover:text-black"
                title={displayName}
              >
                {displayName}
              </Link>

              <Link
                href="/listings/new"
                className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                <span className="text-base">+</span>
                Post a listing
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-black"
              >
                Log in
              </Link>

              <Link
                href="/auth/register"
                className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-900 transition hover:bg-gray-100 md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile navigation */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-5 pb-5 pt-3 md:hidden">
          <nav
            className="flex flex-col"
            aria-label="Mobile navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-3 text-sm ${
                  isActive(link.href)
                    ? "bg-gray-100 font-semibold text-black"
                    : "font-medium text-gray-600 hover:bg-gray-50 hover:text-black"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {loggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-black"
                >
                  Dashboard
                </Link>

                <Link
                  href="/listings/new"
                  className="mt-3 rounded-full bg-black px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  + Post a listing
                </Link>
              </>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link
                  href="/auth/login"
                  className="rounded-full border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900"
                >
                  Log in
                </Link>

                <Link
                  href="/auth/register"
                  className="rounded-full bg-black px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Get started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
