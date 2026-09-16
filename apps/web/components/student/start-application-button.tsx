import { cn } from "@/lib/utils";

export function StartApplicationButton({
  programSlug,
  fullWidth = false,
}: {
  programSlug?: string;
  programId?: string;
  intakes?: { id: string; name: string }[];
  fullWidth?: boolean;
}) {
  const href = programSlug
    ? `/student/applications?program=${encodeURIComponent(programSlug)}`
    : "/student/applications";

  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-accent px-3 text-xs font-medium text-accent-fg transition-colors duration-[var(--duration)] hover:bg-[color-mix(in_srgb,var(--brand)_88%,#000000)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        fullWidth && "w-full",
      )}
    >
      Apply in CRM
    </a>
  );
}
