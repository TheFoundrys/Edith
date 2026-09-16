import Link from "next/link";
import { createLessonMcqSetAction } from "@/lib/actions/admin-lesson-mcq";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { parseMcqQuestions } from "@/lib/assessments/mcq-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function AdminLessonMcqsPage() {
  const session = await requireCapability("manageContent");

  const [lessons, sets] = await Promise.all([
    prisma.syllabusLesson.findMany({
      where: {
        module: {
          syllabus: {
            program: { organizationId: session.user.organizationId },
          },
        },
      },
      select: {
        id: true,
        title: true,
        module: {
          select: {
            title: true,
            syllabus: {
              select: {
                program: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
      orderBy: { title: "asc" },
      take: 500,
    }),
    prisma.lessonMcq.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        lesson: { select: { title: true } },
        program: { select: { title: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const lessonsWithoutQuiz = lessons.filter(
    (lesson) => !sets.some((set) => set.lessonId === lesson.id),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lesson MCQ banks"
        description="Quizzes attached to syllabus lessons — randomized order and options per attempt."
      />

      <Panel className="p-5 max-w-xl space-y-4">
        <h2 className="font-display text-lg text-brand">Attach quiz to lesson</h2>
        <form action={createLessonMcqSetAction} className="space-y-3">
          <div>
            <Label htmlFor="lessonId">Lesson</Label>
            <select
              id="lessonId"
              name="lessonId"
              required
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 py-2 text-sm"
            >
              <option value="">Select lesson</option>
              {lessonsWithoutQuiz.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.module.syllabus.program.title} · {lesson.module.title}{" "}
                  · {lesson.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="passingScore">Pass %</Label>
            <Input
              id="passingScore"
              name="passingScore"
              type="number"
              min={0}
              max={100}
              defaultValue={70}
            />
          </div>
          <Button type="submit" disabled={lessonsWithoutQuiz.length === 0}>
            Create lesson quiz
          </Button>
        </form>
        {lessonsWithoutQuiz.length === 0 ? (
          <p className="text-xs text-fg-muted">
            All listed lessons already have a quiz, or no lessons exist yet.
          </p>
        ) : null}
      </Panel>

      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-fg-muted">
              <th className="px-4 py-3 font-medium">Program</th>
              <th className="px-4 py-3 font-medium">Lesson</th>
              <th className="px-4 py-3 font-medium">Bank size</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Edit</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set) => {
              const count = parseMcqQuestions(set.questions).length;
              return (
                <tr key={set.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{set.program.title}</td>
                  <td className="px-4 py-3 font-medium">{set.lesson.title}</td>
                  <td className="px-4 py-3">{count}</td>
                  <td className="px-4 py-3">
                    <Badge tone={set.status === "READY" ? "success" : "neutral"}>
                      {set.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/lesson-mcqs/${set.id}`} className="underline">
                      Manage
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sets.length === 0 ? (
          <p className="p-4 text-sm text-fg-muted">No lesson quizzes yet.</p>
        ) : null}
      </Panel>
    </div>
  );
}
