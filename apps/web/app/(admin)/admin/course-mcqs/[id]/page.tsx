import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addCourseMcqQuestionAction,
  deleteCourseMcqQuestionAction,
  importCourseMcqJsonAction,
  publishCourseMcqAction,
  updateCourseMcqSettingsAction,
} from "@/lib/actions/admin-course-mcq";
import { CourseMcqAiPanel } from "@/components/admin/course-mcq-ai-panel";
import { McqJsonImportPanel } from "@/components/admin/mcq-json-import-panel";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { parseMcqQuestions } from "@/lib/assessments/mcq-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function AdminCourseMcqDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCapability("manageContent");

  const mcq = await prisma.courseMcq.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { program: { select: { title: true, id: true } } },
  });
  if (!mcq) notFound();

  const bank = parseMcqQuestions(mcq.questions);

  return (
    <div className="space-y-8">
      <PageHeader
        title={mcq.title ?? "MCQ bank"}
        description={`${mcq.program.title} · Set ${mcq.setNumber || 1} · ${bank.length} questions in bank`}
        actions={
          <Link href="/admin/course-mcqs" className="text-sm text-fg-muted underline">
            All banks
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-5 space-y-4">
          <h2 className="font-display text-lg text-brand">Settings</h2>
          <form action={updateCourseMcqSettingsAction} className="space-y-3">
            <input type="hidden" name="mcqId" value={mcq.id} />
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={mcq.title ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="totalQuestions">Random questions per attempt</Label>
                <Input
                  id="totalQuestions"
                  name="totalQuestions"
                  type="number"
                  min={1}
                  defaultValue={mcq.totalQuestions}
                />
              </div>
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
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Save settings
            </Button>
          </form>
          <p className="text-xs text-fg-muted">
            Students see up to {mcq.totalQuestions} questions per attempt, drawn and
            shuffled from the {bank.length} questions below. Options are randomized too.
          </p>
          <form action={publishCourseMcqAction}>
            <input type="hidden" name="mcqId" value={mcq.id} />
            <Button type="submit" disabled={bank.length === 0}>
              {mcq.status === "READY" ? "Republish" : "Publish for students"}
            </Button>
          </form>
          <Badge tone={mcq.status === "READY" ? "success" : "neutral"}>
            {mcq.status}
          </Badge>
        </Panel>

        <Panel className="p-5 space-y-4">
          <h2 className="font-display text-lg text-brand">Add question</h2>
          <form action={addCourseMcqQuestionAction} className="space-y-3">
            <input type="hidden" name="mcqId" value={mcq.id} />
            <div>
              <Label htmlFor="prompt">Question</Label>
              <Textarea id="prompt" name="prompt" rows={3} required />
            </div>
            {[0, 1, 2, 3].map((index) => (
              <div key={index}>
                <Label htmlFor={`option${index}`}>Option {index + 1}</Label>
                <Input id={`option${index}`} name={`option${index}`} required={index < 2} />
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

      <CourseMcqAiPanel
        mode="set"
        mcqId={mcq.id}
        setNumber={mcq.setNumber}
        programTitle={mcq.program.title}
      />

      <McqJsonImportPanel
        mcqId={mcq.id}
        action={importCourseMcqJsonAction}
        bankSize={bank.length}
        isPublished={mcq.status === "READY"}
      />

      <Panel className="p-5 space-y-4">
        <h2 className="font-display text-lg text-brand">Question bank ({bank.length})</h2>
        {bank.length === 0 ? (
          <p className="text-sm text-fg-muted">Add questions above to build the bank.</p>
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
                <form action={deleteCourseMcqQuestionAction} className="mt-2">
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
