"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitPersonalitySection } from "@/lib/actions/personality-profile";
import type { PersonalitySectionId } from "@/lib/assessments/personality-profile";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";

type Question = {
  id: string;
  prompt: string;
  options: string[];
};

export function PersonalitySectionForm({
  section,
  questions,
}: {
  section: PersonalitySectionId;
  questions: Question[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <div key={question.id} className="space-y-3 border border-border p-4">
          <p className="text-sm font-medium">
            {index + 1}. {question.prompt}
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

      <FieldError>{error}</FieldError>

      <Button
        loading={pending}
        onClick={() => {
          setError(null);
          if (Object.keys(answers).length < questions.length) {
            setError("Answer every question before submitting.");
            return;
          }
          startTransition(async () => {
            const result = await submitPersonalitySection(section, answers);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push(result.nextHref);
            router.refresh();
          });
        }}
      >
        {pending ? "Submitting…" : "Submit section"}
      </Button>
    </div>
  );
}
