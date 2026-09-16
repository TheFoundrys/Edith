"use client";

import { useState } from "react";
import { CourseMcqAiPanel } from "@/components/admin/course-mcq-ai-panel";
import { Label } from "@/components/ui/input";
import { Panel } from "@/components/ui/page";

export function CourseMcqAiProgramPicker({
  programs,
}: {
  programs: Array<{ id: string; title: string }>;
}) {
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const program = programs.find((row) => row.id === programId);

  if (programs.length === 0) return null;

  return (
    <Panel className="p-5 space-y-4">
      <div>
        <Label htmlFor="ai-program">Program for AI generation</Label>
        <select
          id="ai-program"
          value={programId}
          onChange={(event) => setProgramId(event.target.value)}
          className="mt-1 w-full max-w-xl rounded-[var(--radius-sm)] border border-border bg-bg px-3 py-2 text-sm"
        >
          {programs.map((row) => (
            <option key={row.id} value={row.id}>
              {row.title}
            </option>
          ))}
        </select>
      </div>
      {programId ? (
        <CourseMcqAiPanel
          mode="program"
          programId={programId}
          programTitle={program?.title}
        />
      ) : null}
    </Panel>
  );
}
