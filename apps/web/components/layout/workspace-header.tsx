"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { WorkspaceAccountMenu } from "@/components/layout/workspace-account-menu";
import { WorkspaceNotificationsButton } from "@/components/layout/workspace-notifications-button";
import { WorkspaceSearch } from "@/components/layout/workspace-search";
import type { WorkspaceNavGroup } from "@/components/layout/workspace-sidebar";

export function WorkspaceHeader({
  navGroups,
  profileHref,
  notificationsHref,
  unreadNotifications,
  variant,
  userRoleLabel,
  onSignOut,
  signingOut,
}: {
  navGroups: WorkspaceNavGroup[];
  profileHref?: string;
  notificationsHref?: string;
  unreadNotifications?: number;
  variant: "student" | "admin";
  userRoleLabel: string;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <header className="workspace-header">
      <SidebarTrigger className="md:hidden" />
      <WorkspaceSearch
        navGroups={navGroups}
        variant={variant}
        extraPages={
          notificationsHref
            ? [{ href: notificationsHref, label: "Notifications" }]
            : undefined
        }
      />
      <div className="workspace-header-actions">
        {notificationsHref ? (
          <WorkspaceNotificationsButton
            href={notificationsHref}
            unreadCount={unreadNotifications}
          />
        ) : null}
        <WorkspaceAccountMenu
          profileHref={profileHref}
          roleLabel={userRoleLabel}
          onSignOut={onSignOut}
          signingOut={signingOut}
        />
      </div>
    </header>
  );
}
