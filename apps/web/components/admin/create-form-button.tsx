"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createFormDefinition } from "@/lib/actions/forms";
import { Button } from "@/components/ui/button";

export function CreateFormButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      {error ? <span className="text-xs text-danger">{error}</span> : null}
      <Button
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const fd = new FormData();
            fd.set("name", "New application form");
            fd.set("description", "Draft form");
            const result = await createFormDefinition(fd);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.push(`/admin/forms/${result.id}`);
          })
        }
      >
        {pending ? "Creating…" : "New form"}
      </Button>
    </div>
  );
}
