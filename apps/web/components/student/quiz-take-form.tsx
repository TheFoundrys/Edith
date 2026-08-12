"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitQuizAttempt } from "@/lib/actions/quizzes";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";

type Question = {
  id: string;
  prompt: string;
  options: string[];
};

export function QuizTakeForm({
  quizId,
  questions,
}: {
  quizId: string;
  questions: Question[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {questions.map((q, index) => (
        <div key={q.id} className="border border-border p-4 space-y-3">
          <p className="text-sm font-medium">
            {index + 1}. {q.prompt}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <label key={oi} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name={q.id}
                  className="mt-1"
                  checked={answers[q.id] === oi}
                  onChange={() =>
                    setAnswers((prev) => ({ ...prev, [q.id]: oi }))
                  }
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <FieldError>{error}</FieldError>
      {result ? (
        <p className="text-sm font-medium">
          Score: {result.score} / {result.maxScore}
        </p>
      ) : null}

      <Button
        loading={pending}
        disabled={Boolean(result)}
        onClick={() => {
          setError(null);
          if (Object.keys(answers).length < questions.length) {
            setError("Answer every question before submitting.");
            return;
          }
          startTransition(async () => {
            const res = await submitQuizAttempt(quizId, answers);
            if (res.error) {
              setError(res.error);
              return;
            }
            setResult({ score: res.score!, maxScore: res.maxScore! });
            router.refresh();
          });
        }}
      >
        {pending ? "Submitting…" : result ? "Submitted" : "Submit quiz"}
      </Button>
    </div>
  );
}
