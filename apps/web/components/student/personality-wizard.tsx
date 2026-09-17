"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Identity", detail: "Contact & IDs" },
  { id: 2, label: "Resume", detail: "Upload skills" },
  { id: 3, label: "Exam", detail: "Pay, then sit" },
] as const;

export type PersonalityWizardStep = 1 | 2 | 3;

export function PersonalityStepIndex({
  n,
  done,
  current,
}: {
  n: PersonalityWizardStep;
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
  onSelect,
}: {
  current: PersonalityWizardStep;
  done: { identity: boolean; resume: boolean; exam: boolean };
  onSelect?: (step: PersonalityWizardStep) => void;
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
        const canOpen = reachable(step.id);
        const status = isDone
          ? "Complete"
          : isCurrent
            ? "Current step"
            : canOpen
              ? "Available"
              : "Locked";

        const inner = (
          <>
            <span className="personality-step-rail" aria-hidden>
              <PersonalityStepIndex
                n={step.id}
                done={isDone}
                current={isCurrent}
              />
              {index < STEPS.length - 1 ? (
                <span
                  className={cn(
                    "personality-step-connector",
                    isDone && "is-filled",
                  )}
                />
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
              !canOpen && "is-locked",
            )}
          >
            {onSelect && canOpen ? (
              <button
                type="button"
                className="personality-step-hit"
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${step.id}, ${step.label}. ${status}.`}
                onClick={() => onSelect(step.id)}
              >
                {inner}
              </button>
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

export function PersonalityProfileFlow({
  defaultStep,
  done,
  identity,
  resume,
  exam,
}: {
  defaultStep: PersonalityWizardStep;
  done: { identity: boolean; resume: boolean; exam: boolean };
  identity: ReactNode;
  resume: ReactNode;
  exam: ReactNode;
}) {
  const [step, setStep] = useState<PersonalityWizardStep>(defaultStep);

  useEffect(() => {
    setStep(defaultStep);
  }, [defaultStep]);

  const canOpen = (id: PersonalityWizardStep) => {
    if (id === 1) return true;
    if (id === 2) return done.identity;
    return done.resume;
  };

  const go = (next: PersonalityWizardStep) => {
    if (!canOpen(next)) return;
    setStep(next);
  };

  return (
    <div className="personality-flow">
      <PersonalityWizardSteps current={step} done={done} onSelect={go} />

      <div className="personality-flow-stage" role="tabpanel">
        {step === 1 ? identity : null}
        {step === 2 ? resume : null}
        {step === 3 ? exam : null}
      </div>

      {done.exam ? null : (
        <div className="personality-flow-nav">
          {step > 1 ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => go((step - 1) as PersonalityWizardStep)}
            >
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < 3 && canOpen((step + 1) as PersonalityWizardStep) ? (
            <Button
              type="button"
              size="sm"
              onClick={() => go((step + 1) as PersonalityWizardStep)}
            >
              Continue
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
