"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getAccessToken, getStoredUser } from "@/lib/auth";
import ChatNotifications from "@/components/ChatNotifications";

const navLinks = [
  { label: "My listings", href: "/listings/mine" },
];

function HeaderContent() {
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
    return () => window.removeEventListener("storage", syncAuth);
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href) => {
    if (href === "/listings") return pathname === "/listings";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const displayName =
    user?.full_name ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Account";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg text-slate-900 transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-2"
          aria-label="NowYours home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            N
          </span>
          <span className="text-base font-semibold tracking-tight">
            NowYours
          </span>
        </Link>

        {/* Desktop navigation */}
        

        {/* Desktop account actions */}
        <div className="hidden items-center gap-2 md:flex">
          {loggedIn ? (
            <>
              <Link className="max-w-32 truncate rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20" href="/listings/mine">My Listings</Link>
              <ChatNotifications />

              <Link
                href="/wishlist"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                </svg>
                Wishlist
              </Link>

              <Link
                href="/dashboard"
                className="max-w-32 truncate rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
                title={displayName}
              >
                {displayName}
              </Link>

              <Link
                href="/listings/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
              >
                <span className="text-base leading-none">+</span>
                Post a listing
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
              >
                Log in
              </Link>

              <Link
                href="/auth/register"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
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
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile navigation */}
      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-3 text-sm transition ${
                  isActive(link.href)
                    ? "bg-slate-100 font-semibold text-slate-900"
                    : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {loggedIn ? (
              <>
                <Link
                  href="/wishlist"
                  className="rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  Wishlist
                </Link>

                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  Dashboard
                </Link>

                <Link
                  href="/listings/new"
                  className="mt-3 rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  + Post a listing
                </Link>
              </>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link
                  href="/auth/login"
                  className="rounded-lg border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900 transition hover:bg-slate-50"
                >
                  Log in
                </Link>

                <Link
                  href="/auth/register"
                  className="rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800"
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

export default function Header() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-50 h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl" />
      }
    >
      <HeaderContent />
    </Suspense>
  );
}