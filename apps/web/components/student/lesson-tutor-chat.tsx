"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { askLessonTutor } from "@/lib/actions/tutor";
import type { AiTutorMessage } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Panel } from "@/components/ui/page";

type ChatMessage = AiTutorMessage & { id: string };

export function LessonTutorChat({
  courseId,
  lessonId,
  courseName,
  lessonTitle,
  moduleTitle,
}: {
  courseId: string;
  lessonId: string;
  courseName: string;
  lessonTitle: string;
  moduleTitle: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function send() {
    const content = draft.trim();
    if (!content || pending) return;

    const nextUser: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
    };
    const history = [...messages, nextUser];
    setMessages(history);
    setDraft("");
    setError(null);

    startTransition(async () => {
      const result = await askLessonTutor({
        courseId,
        lessonId,
        messages: history.map(({ role, content: c }) => ({ role, content: c })),
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("ok" in result && result.ok) {
        setProvider(result.provider);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: result.reply,
          },
        ]);
      }
    });
  }

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">Lesson tutor</h2>
          <p className="mt-1 text-xs text-fg-muted">
            Answers use live course data for {courseName} · {moduleTitle} ·{" "}
            {lessonTitle}
            {provider ? ` · plugin: ${provider}` : ""}.
          </p>
        </div>
      </div>

      <div className="mb-3 max-h-72 overflow-y-auto space-y-3 rounded-[var(--radius-sm)] border border-border bg-bg p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-fg-muted">
            Ask about this lesson — the tutor is grounded in the published syllabus
            and lesson content, not generic chat.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ml-6 text-sm whitespace-pre-wrap"
                  : "mr-6 text-sm whitespace-pre-wrap text-fg"
              }
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted mb-0.5">
                {m.role === "user" ? "You" : "Tutor"}
              </p>
              {m.content}
            </div>
          ))
        )}
        {pending ? (
          <p className="text-xs text-fg-muted">Tutor is reading course details…</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="mb-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question about this lesson…"
          rows={2}
          className="min-h-[2.75rem]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button
          type="button"
          onClick={send}
          loading={pending}
          disabled={!draft.trim()}
          className="shrink-0"
        >
          {pending ? "Sending…" : "Ask"}
        </Button>
      </div>
    </Panel>
  );
}
