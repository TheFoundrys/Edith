import { Badge } from "@/components/ui/badge";
import { lessonContentTypeMeta } from "@/lib/learning/lesson-content-type";
import { cn } from "@/lib/utils";

/** Server-safe activity type badge (no client-only icon libs). */
export function LessonTypeBadge({
  contentType,
  className,
}: {
  contentType: string | null | undefined;
  className?: string;
}) {
  const meta = lessonContentTypeMeta(contentType);

  return (
    <Badge tone={meta.badgeTone} className={cn("gap-1", className)}>
      <span aria-hidden>{meta.icon}</span>
      {meta.shortLabel}
    </Badge>
  );
}
