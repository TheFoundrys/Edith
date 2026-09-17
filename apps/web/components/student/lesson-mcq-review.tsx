import type { McqReviewQuestion } from "@/lib/assessments/course-mcq-paper";
import { Panel } from "@/components/ui/page";
import { cn } from "@/lib/utils";

export function LessonMcqReview({ questions }: { questions: McqReviewQuestion[] }) {
  if (questions.length === 0) return null;

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Panel key={question.id} className="p-5 space-y-3">
          <p className="text-sm font-medium">
            {index + 1}. {question.prompt}
          </p>
          <ul className="space-y-2 text-sm">
            {question.options.map((option, optionIndex) => {
              const selected = question.selectedIndex === optionIndex;
              const correct = question.correctIndex === optionIndex;
              return (
                <li
                  key={`${question.id}-${optionIndex}`}
                  className={cn(
                    "rounded-[var(--radius-sm)] border px-3 py-2",
                    correct
                      ? "border-fg font-medium text-fg"
                      : selected
                        ? "border-border-strong text-fg"
                        : "border-border text-fg-muted",
                  )}
                >
                  {correct ? "Correct · " : selected ? "Your answer · " : ""}
                  {option}
                </li>
              );
            })}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
