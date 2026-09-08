import Image from "next/image";
import type { ProgramCategory } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  courseCoverSrc,
  resolveCourseVisualTheme,
  type CourseVisualTheme,
} from "@/lib/programs/course-visual";

type CourseVisualIllustrationProps = {
  track?: CourseVisualTheme;
  title?: string;
  domainSlug?: string | null;
  tags?: string[];
  category?: ProgramCategory | null;
  variant?: "hero" | "card";
  overlay?: boolean;
  className?: string;
};

export function CourseVisualIllustration({
  track,
  title,
  domainSlug,
  tags,
  category,
  variant = "hero",
  overlay = true,
  className,
}: CourseVisualIllustrationProps) {
  const theme = resolveCourseVisualTheme({
    track,
    title,
    domainSlug,
    tags,
    category,
  });

  return (
    <span className={cn("course-visual-illustration", className)}>
      <Image
        src={courseCoverSrc(theme, title ?? theme)}
        alt=""
        fill
        sizes={
          variant === "hero"
            ? "(max-width: 768px) 100vw, 42vw"
            : "(max-width: 768px) 100vw, 33vw"
        }
        className="object-cover"
      />
      {overlay ? <span className="course-visual-scrim" aria-hidden /> : null}
    </span>
  );
}

export type { CourseVisualTheme };
