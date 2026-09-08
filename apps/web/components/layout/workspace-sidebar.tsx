"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/layout/brand-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { navIconFor } from "@/lib/nav/icons";
import { cn } from "@/lib/utils";

export type WorkspaceNavItem = { href: string; label: string };

export type WorkspaceNavGroup = {
  label: string;
  items: WorkspaceNavItem[];
};

function isNavActive(pathname: string, href: string, allHrefs: string[]) {
  const isSectionRoot =
    href === "/student" || href === "/student/dashboard" || href === "/admin";
  const matches = isSectionRoot
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
  if (!matches) return false;
  return !allHrefs.some(
    (other) =>
      other !== href &&
      other.length > href.length &&
      (pathname === other || pathname.startsWith(`${other}/`)),
  );
}

function navWithoutHeaderShortcuts(
  groups: WorkspaceNavGroup[],
  shortcuts: Array<string | undefined>,
) {
  const skip = new Set(shortcuts.filter(Boolean) as string[]);
  if (skip.size === 0) return groups;
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !skip.has(item.href)),
    }))
    .filter((group) => group.items.length > 0);
}

export function WorkspaceSidebar({
  nav,
  navGroups,
  profileHref,
  notificationsHref,
}: {
  nav?: WorkspaceNavItem[];
  navGroups?: WorkspaceNavGroup[];
  profileHref?: string;
  notificationsHref?: string;
  variant?: "student" | "admin";
  userRoleLabel?: string;
}) {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const brandHref = pathname.startsWith("/admin")
    ? "/admin"
    : "/student/dashboard";
  const groups = navWithoutHeaderShortcuts(
    navGroups ??
      (nav ? [{ label: "Workspace", items: nav }] : [{ label: "Workspace", items: [] }]),
    [profileHref, notificationsHref],
  );
  const allHrefs = groups.flatMap((group) => group.items.map((item) => item.href));

  return (
    <Sidebar collapsible="icon" className="workspace-sidebar">
      <SidebarHeader className="workspace-sidebar-header shrink-0 gap-0 border-b border-border p-0">
        <div
          className={cn(
            "flex h-14 w-full items-center px-3",
            collapsed ? "justify-center" : "justify-between gap-2",
          )}
        >
          {collapsed ? (
            <SidebarTrigger className="shrink-0" />
          ) : (
            <>
              <BrandMark href={brandHref} className="min-w-0 flex-1" />
              <SidebarTrigger className="hidden shrink-0 md:inline-flex" />
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="workspace-sidebar-content">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = navIconFor(item.href, item.label);
                  const active = isNavActive(pathname, item.href, allHrefs);
                  return (
                    <SidebarMenuItem key={`${item.href}-${item.label}`}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                      >
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false);
                          }}
                        >
                          <Icon strokeWidth={1.75} aria-hidden />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
