import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LmsPageIntro({
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: {
  title: React.ReactNode;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="font-display text-2xl tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-xl text-sm text-fg-muted">{description}</p>
        ) : null}
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref}>
          <Button size="sm">{actionLabel}</Button>
        </Link>
      ) : null}
    </header>
  );
}
