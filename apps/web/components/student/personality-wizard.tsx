import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Identity", detail: "Aadhaar and PAN" },
  { id: 2, label: "Resume", detail: "Skills and match" },
  { id: 3, label: "Exam", detail: "₹3,500 sitting" },
] as const;

export function PersonalityStepIndex({
  n,
  done,
  current,
}: {
  n: 1 | 2 | 3;
  done?: boolean;
  current?: boolean;
}) {
  return (
    <span
      className={cn(
        "personality-step-index",
        done && "is-done",
        current && !done && "is-current",
      )}
      aria-hidden
    >
      {done ? <Check className="size-3.5" strokeWidth={2.5} /> : n}
    </span>
  );
}

export function PersonalityWizardSteps({
  current,
  done,
}: {
  current: 1 | 2 | 3;
  done: { identity: boolean; resume: boolean; exam: boolean };
}) {
  const complete = (id: number) => {
    if (id === 1) return done.identity;
    if (id === 2) return done.resume;
    return done.exam;
  };

  const reachable = (id: number) => {
    if (id === 1) return true;
    if (id === 2) return done.identity;
    return done.resume;
  };

  return (
    <ol className="personality-steps" aria-label="Personality Profile steps">
      {STEPS.map((step, index) => {
        const isDone = complete(step.id);
        const isCurrent = current === step.id && !done.exam;
        const href = reachable(step.id)
          ? `#personality-step-${step.id}`
          : undefined;
        const status = isDone
          ? "Complete"
          : isCurrent
            ? "Current step"
            : "Upcoming";
        const inner = (
          <>
            <span className="personality-step-rail" aria-hidden>
              <PersonalityStepIndex
                n={step.id}
                done={isDone}
                current={isCurrent}
              />
              {index < STEPS.length - 1 ? (
                <span className="personality-step-connector" />
              ) : null}
            </span>
            <span className="personality-step-copy">
              <span className="personality-step-kicker">Step {step.id}</span>
              <span className="personality-step-label">{step.label}</span>
              <span className="personality-step-detail">{step.detail}</span>
            </span>
          </>
        );

        return (
          <li
            key={step.id}
            className={cn(
              "personality-step",
              isDone && "is-done",
              isCurrent && "is-current",
              !isDone && !isCurrent && "is-upcoming",
            )}
          >
            {href ? (
              <a
                href={href}
                className="personality-step-hit"
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${step.id}, ${step.label}. ${status}.`}
              >
                {inner}
              </a>
            ) : (
              <div
                className="personality-step-hit"
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${step.id}, ${step.label}. ${status}.`}
              >
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
