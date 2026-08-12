"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PeakArtBackdrop } from "@/components/layout/peak-art-backdrop";

type NavItem = { href: string; label: string };

export function AppShell({
  brand,
  nav,
  user,
  children,
}: {
  brand: string;
  nav: NavItem[];
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [signingOut, startSignOut] = useTransition();

  function handleSignOut() {
    startSignOut(async () => {
      await signOut({ callbackUrl: "/login" });
    });
  }

  return (
    <div className="min-h-full flex">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-bg-elevated">
        <div className="px-5 h-14 flex items-center border-b border-border">
          <Link href="/" className="font-display text-lg tracking-tight text-brand">
            {brand}
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5" aria-label="Primary">
          {nav.map((item) => {
            const isSectionRoot =
              item.href === "/student" ||
              item.href === "/student/dashboard" ||
              item.href === "/admin";
            const active = isSectionRoot
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block border-l-2 px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-fg bg-bg text-fg font-medium"
                    : "border-transparent text-fg-muted hover:text-fg hover:bg-bg",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-fg-muted truncate">{user.email}</p>
          <p className="text-[10px] text-fg-muted mt-1.5 uppercase tracking-[0.14em]">
            {user.role}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start px-0"
            loading={signingOut}
            onClick={handleSignOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 min-h-full flex flex-col peak-atmosphere">
        <PeakArtBackdrop variant="workspace" />
        <header className="md:hidden h-14 border-b border-border bg-bg-elevated/85 backdrop-blur px-4 flex items-center justify-between">
          <span className="font-display text-lg text-brand">{brand}</span>
          <Button
            variant="ghost"
            size="sm"
            loading={signingOut}
            onClick={handleSignOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </header>
        <div className="md:hidden border-b border-border bg-bg-elevated/85 backdrop-blur overflow-x-auto">
          <nav className="flex gap-1 px-3 py-2" aria-label="Primary mobile">
            {nav.map((item) => {
              const isSectionRoot =
                item.href === "/student" ||
                item.href === "/student/dashboard" ||
                item.href === "/admin";
              const active = isSectionRoot
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap border-b-2 px-3 py-2 text-xs transition-colors",
                    active
                      ? "border-fg text-fg font-medium"
                      : "border-transparent text-fg-muted",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <main
          id="main-content"
          className="flex-1 p-[var(--grid-pad)] md:p-[calc(var(--grid-pad)*1.25)] max-w-6xl w-full mx-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
