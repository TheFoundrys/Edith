import { cn } from "@frontend/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-brand tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm text-fg-muted max-w-2xl leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-border bg-bg-elevated",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Modular cm × cm container grid. */
export function CmGrid({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "2" | "3";
}) {
  const gridClass =
    variant === "3" ? "cm-grid-3" : variant === "2" ? "cm-grid-2" : "cm-grid";
  return <div className={cn(gridClass, className)}>{children}</div>;
}

export function CmBox({
  children,
  className,
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn(size === "sm" ? "cm-box-sm" : "cm-box", className)}>
      {children}
    </div>
  );
}
