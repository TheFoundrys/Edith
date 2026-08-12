import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-[color-mix(in_srgb,var(--brand)_86%,#000000)]",
  secondary:
    "bg-transparent text-brand border border-brand hover:bg-brand hover:text-accent-fg",
  ghost: "bg-transparent text-fg-muted hover:text-fg",
  danger: "bg-fg text-accent-fg hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs tracking-wide",
  md: "h-10 px-4 text-sm tracking-wide",
};

function ButtonSpinner({ size }: { size: Size }) {
  return (
    <span
      className={cn(
        "btn-spinner shrink-0 rounded-full border-2 border-current border-r-transparent",
        size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
      )}
      aria-hidden
    />
  );
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    /** Shows spinner and disables the button while true. */
    loading?: boolean;
  }
>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <ButtonSpinner size={size} /> : null}
      {children}
    </button>
  );
});
