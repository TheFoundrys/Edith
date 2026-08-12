import { NotificationsClient } from "@/components/student/notifications-client";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function StudentNotificationsPage() {
  const session = await requireStudent();
  const items = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <NotificationsClient
      items={items.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        href: n.href,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      }))}
    />
  );
}
