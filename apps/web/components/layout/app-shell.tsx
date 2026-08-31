"use client";

import { signOut } from "next-auth/react";
import { useTransition } from "react";
import { SiteHeader } from "@/components/layout/home-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { VintageBackdrop } from "@/components/layout/vintage-backdrop";
import {
  WorkspaceSidebar,
  type WorkspaceNavGroup,
  type WorkspaceNavItem,
} from "@/components/layout/workspace-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AppShell({
  nav,
  navGroups,
  children,
  profileHref,
  variant = "student",
  userRoleLabel,
  workspaceHref = "/student/dashboard",
  workspaceLabel = "Continue learning",
}: {
  brand?: string;
  nav?: NavItem[];
  navGroups?: WorkspaceNavGroup[];
  profileHref?: string;
  variant?: "student" | "admin";
  userRoleLabel?: string;
  workspaceHref?: string;
  workspaceLabel?: string;
  children: React.ReactNode;
}) {
  const [signingOut, startSignOut] = useTransition();

  function handleSignOut() {
    startSignOut(async () => {
      await signOut({ callbackUrl: "/login" });
    });
  }

  const accountHref = profileHref;

  return (
    <div className="neo-workspace flex min-h-svh flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteHeader
        loggedIn
        workspaceHref={workspaceHref}
        workspaceLabel={workspaceLabel}
        variant="sticky"
      />
      <SidebarProvider className="flex min-h-0 flex-1">
        <WorkspaceSidebar
          nav={nav}
          navGroups={navGroups}
          profileHref={accountHref}
          variant={variant}
          userRoleLabel={userRoleLabel}
          onSignOut={handleSignOut}
          signingOut={signingOut}
          hideBrand
        />

        <SidebarInset className="peak-atmosphere flex min-h-0 flex-col">
          <VintageBackdrop variant="workspace" />
          <div
            id="main-content"
            className={cn(
              "flex-1 px-4 py-5 md:px-6 md:py-6 w-full mx-auto overflow-auto",
              variant === "admin" ? "max-w-[90rem]" : "max-w-7xl",
            )}
          >
            {children}
          </div>
          <SiteFooter />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

type NavItem = WorkspaceNavItem;
