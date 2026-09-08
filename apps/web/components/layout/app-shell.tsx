"use client";

import { signOut } from "next-auth/react";
import { useTransition } from "react";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import {
  WorkspaceSidebar,
  type WorkspaceNavGroup,
  type WorkspaceNavItem,
} from "@/components/layout/workspace-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AppShell({
  nav,
  navGroups,
  children,
  profileHref,
  notificationsHref,
  unreadNotifications,
  variant = "student",
  userRoleLabel,
}: {
  brand?: string;
  nav?: NavItem[];
  navGroups?: WorkspaceNavGroup[];
  profileHref?: string;
  notificationsHref?: string;
  unreadNotifications?: number;
  variant?: "student" | "admin";
  userRoleLabel?: string;
  workspaceHref?: string;
  workspaceLabel?: string;
  children: React.ReactNode;
}) {
  const [signingOut, startSignOut] = useTransition();
  const groups =
    navGroups ?? (nav ? [{ label: "Workspace", items: nav }] : []);

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
          notificationsHref={notificationsHref}
        />

        <SidebarInset className="workspace-shell-main">
          <WorkspaceHeader
            navGroups={groups}
            profileHref={profileHref}
            notificationsHref={notificationsHref}
            unreadNotifications={unreadNotifications}
            variant={variant}
            userRoleLabel={
              userRoleLabel ?? (variant === "admin" ? "Staff" : "Learner")
            }
            onSignOut={handleSignOut}
            signingOut={signingOut}
          />

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
