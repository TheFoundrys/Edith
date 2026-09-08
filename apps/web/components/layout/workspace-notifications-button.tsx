"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

export function WorkspaceNotificationsButton({
  href,
  unreadCount = 0,
}: {
  href: string;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const count = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <Link
      href={href}
      className="workspace-header-icon"
      aria-label={
        count
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
      aria-current={active ? "page" : undefined}
    >
      <Bell className="size-4" strokeWidth={1.75} aria-hidden />
      {count ? (
        <span className="workspace-header-icon-count">{count}</span>
      ) : null}
    </Link>
  );
}
