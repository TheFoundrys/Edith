import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createForumReplyAction,
  incrementForumThreadViews,
} from "@/lib/actions/forums";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const session = await requireStudent();

  const thread = await prisma.forumThread.findFirst({
    where: {
      id: threadId,
      category: { organizationId: session.user.organizationId },
    },
    include: {
      author: { select: { name: true } },
      category: { select: { id: true, name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!thread) notFound();

  await incrementForumThreadViews(thread.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={thread.title}
        description={`${thread.category.name} · ${thread.author.name}`}
        actions={
          <Link href="/student/forums" className="text-sm text-fg-muted underline">
            All forums
          </Link>
        }
      />

      <Panel className="p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {thread.isPinned ? <Badge tone="neutral">Pinned</Badge> : null}
          {thread.isLocked ? <Badge tone="warning">Locked</Badge> : null}
          <span className="text-xs text-fg-muted">
            {thread.viewCount} views · {thread.replyCount} replies
          </span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{thread.content}</p>
        <p className="text-xs text-fg-muted">
          Posted {thread.createdAt.toLocaleString()}
        </p>
      </Panel>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Replies ({thread.replies.length})</h2>
        {thread.replies.length === 0 ? (
          <p className="text-sm text-fg-muted">No replies yet. Start the discussion.</p>
        ) : (
          thread.replies.map((reply) => (
            <Panel key={reply.id} className="p-4">
              <p className="text-xs font-medium text-fg-muted">{reply.author.name}</p>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                {reply.content}
              </p>
              <p className="mt-2 text-xs text-fg-muted">
                {reply.createdAt.toLocaleString()}
              </p>
            </Panel>
          ))
        )}
      </section>

      {!thread.isLocked ? (
        <Panel className="p-5">
          <h2 className="font-display text-lg text-brand mb-3">Add a reply</h2>
          <form action={createForumReplyAction} className="space-y-3">
            <input type="hidden" name="threadId" value={thread.id} />
            <div>
              <Label htmlFor="content">Your reply</Label>
              <Textarea id="content" name="content" required rows={4} />
            </div>
            <Button type="submit">Post reply</Button>
          </form>
        </Panel>
      ) : (
        <p className="text-sm text-fg-muted">This thread is locked. New replies are disabled.</p>
      )}
    </div>
  );
}
