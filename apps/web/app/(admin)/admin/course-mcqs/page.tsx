import Link from "next/link";
import { CourseMcqAiProgramPicker } from "@/components/admin/course-mcq-ai-program-picker";
import { createCourseMcqSetAction } from "@/lib/actions/admin-course-mcq";
import { requireCapability } from "@/lib/auth/session";
import { redirectIfCompassAdminRoute } from "@/lib/compass/require-edith";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";
import { parseMcqQuestions } from "@/lib/assessments/mcq-types";

export default async function AdminCourseMcqsPage() {
  redirectIfCompassAdminRoute();
  const session = await requireCapability("manageContent");

  const [programs, sets] = await Promise.all([
    prisma.program.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.courseMcq.findMany({
      where: { organizationId: session.user.organizationId },
      include: { program: { select: { title: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Course MCQ banks"
        description="Create 3 parallel sets per assessment. Students get a random set; questions and options shuffle each attempt."
      />

      <Panel className="p-5 max-w-xl space-y-4">
        <h2 className="font-display text-lg text-brand">New question bank</h2>
        <form action={createCourseMcqSetAction} className="space-y-3">
          <div>
            <Label htmlFor="programId">Program</Label>
            <select
              id="programId"
              name="programId"
              required
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 py-2 text-sm"
            >
              <option value="">Select program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Mid-term MCQ" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="totalQuestions">Questions per attempt</Label>
              <Input
                id="totalQuestions"
                name="totalQuestions"
                type="number"
                min={1}
                defaultValue={10}
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
                defaultValue={70}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <input type="hidden" name="createThreeSets" value="off" />
            <input
              type="checkbox"
              name="createThreeSets"
              defaultChecked
              value="on"
            />
            Create 3 sets (Set 1, Set 2, Set 3) for randomized sittings
          </label>
          <Button type="submit">Create banks</Button>
        </form>
      </Panel>

      <CourseMcqAiProgramPicker programs={programs} />

      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-fg-muted">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Set</th>
              <th className="px-4 py-3 font-medium">Program</th>
              <th className="px-4 py-3 font-medium">Bank size</th>
              <th className="px-4 py-3 font-medium">Per attempt</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Edit</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set) => {
              const count = parseMcqQuestions(set.questions).length;
              return (
                <tr key={set.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{set.title ?? "Untitled"}</td>
                  <td className="px-4 py-3">{set.setNumber || 1}</td>
                  <td className="px-4 py-3">{set.program.title}</td>
                  <td className="px-4 py-3">{count}</td>
                  <td className="px-4 py-3">{set.totalQuestions}</td>
                  <td className="px-4 py-3">
                    <Badge tone={set.status === "READY" ? "success" : "neutral"}>
                      {set.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/course-mcqs/${set.id}`} className="underline">
                      Manage
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sets.length === 0 ? (
          <p className="p-4 text-sm text-fg-muted">No MCQ banks yet.</p>
        ) : null}
      </Panel>
    </div>
  );
}
