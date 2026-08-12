"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/learning-extras";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";

type Item = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsClient({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <div>
        <PageHeader
          title="Notifications"
          description="Course and account alerts."
        />
        <EmptyState
          title="No notifications"
          description="You’re all caught up."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Course and account alerts."
        actions={
          <Button
            size="sm"
            variant="secondary"
            loading={pending}
            onClick={() => {
              startTransition(async () => {
                await markAllNotificationsRead();
                router.refresh();
              });
            }}
          >
            Mark all read
          </Button>
        }
      />
      <div className="space-y-2">
        {items.map((item) => (
          <Panel
            key={item.id}
            className={`p-4 ${item.readAt ? "opacity-70" : ""}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="font-medium hover:underline"
                    onClick={() => {
                      if (!item.readAt) {
                        void markNotificationRead(item.id);
                      }
                    }}
                  >
                    {item.title}
                  </Link>
                ) : (
                  <p className="font-medium">{item.title}</p>
                )}
                <p className="mt-1 text-sm text-fg-muted">{item.body}</p>
                <p className="mt-2 text-xs text-fg-muted">
                  {new Date(item.createdAt).toLocaleString()}
                  {!item.readAt ? " · Unread" : ""}
                </p>
              </div>
              {!item.readAt ? (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={pending}
                  onClick={() => {
                    startTransition(async () => {
                      await markNotificationRead(item.id);
                      router.refresh();
                    });
                  }}
                >
                  Mark read
                </Button>
              ) : null}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
