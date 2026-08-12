"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enrollFree } from "@/lib/actions/enrollments";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";

export function FreeEnrollButton({ courseSlug }: { courseSlug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        className="w-full sm:w-auto"
        loading={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await enrollFree(courseSlug);
            if (result.error) {
              setError(result.error);
              return;
            }
            if (result.awaitingCrm) {
              router.push(
                `/student/my-courses/${encodeURIComponent(result.programId!)}?pending=crm`,
              );
              return;
            }
            router.push(
              `/payment/success?course=${encodeURIComponent(result.programId!)}&enrollment=${encodeURIComponent(result.enrollmentId!)}`,
            );
          });
        }}
      >
        {pending ? "Enrolling…" : "Enroll for free"}
      </Button>
      <FieldError>{error}</FieldError>
    </div>
  );
}
