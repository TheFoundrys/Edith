"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { submitPersonalityExam } from "@/lib/actions/personality-profile";
import {
  BATTERY_LABELS,
  type PersonalitySectionId,
} from "@/lib/assessments/personality-profile";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { DEFAULT_PAGE_SIZE, paginateItems } from "@/lib/pagination";

type Question = {
  id: string;
  prompt: string;
  options: string[];
  battery: PersonalitySectionId;
};

export function PersonalityExamForm({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const answered = Object.keys(answers).length;
  const slice = useMemo(
    () => paginateItems(questions, page, pageSize),
    [questions, page, pageSize],
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-fg-muted">
        {answered} of {questions.length} answered · submit once at the end
      </p>
      {slice.items.map((question, index) => (
        <div key={question.id} className="space-y-3 border border-border p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
            {BATTERY_LABELS[question.battery]}
          </p>
          <p className="text-sm font-medium">
            {slice.start + index + 1}. {question.prompt}
          </p>
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <label
                key={`${question.id}-${optionIndex}`}
                className="flex items-start gap-2 text-sm"
              >
                <input
                  type="radio"
                  name={question.id}
                  className="mt-1"
                  checked={answers[question.id] === optionIndex}
                  onChange={() =>
                    setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))
                  }
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="-mx-5 border-t border-border">
        <Pagination
          page={slice.page}
          totalPages={slice.totalPages}
          pageSize={pageSize}
          total={questions.length}
          unit="questions"
          onPage={(next) => {
            setError(null);
            setPage(next);
          }}
          onPageSize={(next) => {
            setError(null);
            setPageSize(next);
            setPage(1);
          }}
        />
      </div>

      <FieldError>{error}</FieldError>

      <div className="flex flex-wrap gap-2">
        {slice.page < slice.totalPages ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setError(null);
              setPage(slice.page + 1);
            }}
          >
            Next page
          </Button>
        ) : null}
        <Button
          loading={pending}
          onClick={() => {
            setError(null);
            if (answered < questions.length) {
              const firstUnanswered = questions.findIndex(
                (question) => answers[question.id] === undefined,
              );
              if (firstUnanswered >= 0) {
                setPage(Math.floor(firstUnanswered / pageSize) + 1);
              }
              setError("Answer every question before submitting.");
              return;
            }
            startTransition(async () => {
              const result = await submitPersonalityExam(answers);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              router.push(result.nextHref);
              router.refresh();
            });
          }}
        >
          {pending ? "Submitting…" : "Submit exam"}
        </Button>
      </div>
    </div>
  );
}
