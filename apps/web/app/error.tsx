"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-fg-muted">
          An unexpected error occurred. Try again, or return home.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Link href="/">
            <Button variant="secondary">Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
