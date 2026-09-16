import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addLessonMcqQuestionAction,
  deleteLessonMcqQuestionAction,
  importLessonMcqJsonAction,
  publishLessonMcqAction,
  updateLessonMcqSettingsAction,
} from "@/lib/actions/admin-lesson-mcq";
import { McqJsonImportPanel } from "@/components/admin/mcq-json-import-panel";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { parseMcqQuestions } from "@/lib/assessments/mcq-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function AdminLessonMcqDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCapability("manageContent");

  const mcq = await prisma.lessonMcq.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      lesson: { select: { id: true, title: true } },
      program: { select: { title: true, id: true } },
    },
  });
  if (!mcq) notFound();

  const bank = parseMcqQuestions(mcq.questions);
  const studentHref = `/student/learning/${mcq.programId}/lessons/${mcq.lessonId}/mcq`;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Lesson quiz · ${mcq.lesson.title}`}
        description={`${mcq.program.title} · ${bank.length} questions · all randomized per attempt`}
        actions={
          <Link href="/admin/lesson-mcqs" className="text-sm text-fg-muted underline">
            All lesson quizzes
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-5 space-y-4">
          <h2 className="font-display text-lg text-brand">Settings</h2>
          <form action={updateLessonMcqSettingsAction} className="space-y-3">
            <input type="hidden" name="mcqId" value={mcq.id} />
            <div>
              <Label htmlFor="passingScore">Pass %</Label>
              <Input
                id="passingScore"
                name="passingScore"
                type="number"
                min={0}
                max={100}
                defaultValue={mcq.passingScore || 70}
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Save settings
            </Button>
          </form>
          <form action={publishLessonMcqAction}>
            <input type="hidden" name="mcqId" value={mcq.id} />
            <Button type="submit" disabled={bank.length === 0}>
              {mcq.status === "READY" ? "Republish" : "Publish for students"}
            </Button>
          </form>
          <Badge tone={mcq.status === "READY" ? "success" : "neutral"}>
            {mcq.status}
          </Badge>
          {mcq.status === "READY" ? (
            <p className="text-xs text-fg-muted">
              Student URL:{" "}
              <Link href={studentHref} className="underline">
                {studentHref}
              </Link>
            </p>
          ) : null}
        </Panel>

        <Panel className="p-5 space-y-4">
          <h2 className="font-display text-lg text-brand">Add question</h2>
          <form action={addLessonMcqQuestionAction} className="space-y-3">
            <input type="hidden" name="mcqId" value={mcq.id} />
            <div>
              <Label htmlFor="prompt">Question</Label>
              <Textarea id="prompt" name="prompt" rows={3} required />
            </div>
            {[0, 1, 2, 3].map((index) => (
              <div key={index}>
                <Label htmlFor={`option${index}`}>Option {index + 1}</Label>
                <Input
                  id={`option${index}`}
                  name={`option${index}`}
                  required={index < 2}
                />
              </div>
            ))}
            <div>
              <Label htmlFor="correctIndex">Correct option</Label>
              <select
                id="correctIndex"
                name="correctIndex"
                defaultValue={0}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 py-2 text-sm"
              >
                <option value={0}>Option 1</option>
                <option value={1}>Option 2</option>
                <option value={2}>Option 3</option>
                <option value={3}>Option 4</option>
              </select>
            </div>
            <Button type="submit">Add to bank</Button>
          </form>
        </Panel>
      </div>

      <McqJsonImportPanel
        mcqId={mcq.id}
        action={importLessonMcqJsonAction}
        bankSize={bank.length}
        isPublished={mcq.status === "READY"}
      />

      <Panel className="p-5 space-y-4">
        <h2 className="font-display text-lg text-brand">Question bank ({bank.length})</h2>
        {bank.length === 0 ? (
          <p className="text-sm text-fg-muted">
            Add questions manually or import JSON above.
          </p>
        ) : (
          <ul className="space-y-4">
            {bank.map((question, index) => (
              <li key={question.id} className="border-b border-border pb-4 last:border-0">
                <p className="text-sm font-medium">
                  {index + 1}. {question.prompt}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-fg-muted">
                  {question.options.map((option, optionIndex) => (
                    <li key={optionIndex}>
                      {optionIndex === question.correctIndex ? "✓ " : "· "}
                      {option}
                    </li>
                  ))}
                </ul>
                <form action={deleteLessonMcqQuestionAction} className="mt-2">
                  <input type="hidden" name="mcqId" value={mcq.id} />
                  <input type="hidden" name="questionId" value={question.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
