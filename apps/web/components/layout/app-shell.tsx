"use client";

import { signOut } from "next-auth/react";
import { useTransition } from "react";
import { VintageBackdrop } from "@/components/layout/vintage-backdrop";
import {
  WorkspaceSidebar,
  type WorkspaceNavGroup,
  type WorkspaceNavItem,
} from "@/components/layout/workspace-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AppShell({
  nav,
  navGroups,
  children,
  profileHref,
  variant = "student",
  userRoleLabel,
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

  return (
    <div className="workspace-shell neo-workspace">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <SidebarProvider className="workspace-shell-provider">
        <WorkspaceSidebar
          nav={nav}
          navGroups={navGroups}
          profileHref={profileHref}
          variant={variant}
          userRoleLabel={userRoleLabel}
          onSignOut={handleSignOut}
          signingOut={signingOut}
        />

        <SidebarInset className="workspace-shell-main peak-atmosphere">
          <VintageBackdrop variant="workspace" />

          <SidebarTrigger className="workspace-mobile-trigger md:hidden" />

          <div
            id="main-content"
            className={cn(
              "workspace-shell-content",
              variant === "admin"
                ? "workspace-shell-content-admin"
                : "workspace-shell-content-student",
            )}
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

type NavItem = WorkspaceNavItem;
