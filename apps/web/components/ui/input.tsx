import { cn } from "@/lib/utils";
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from "react";

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-xs font-medium text-fg mb-1.5", className)}
    >
      {children}
    </label>
  );
}

const controlClass =
  "w-full rounded-[var(--radius-sm)] border border-border bg-bg-elevated px-3 text-sm text-fg outline-none transition-[border-color,box-shadow] duration-[var(--duration)] focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_var(--brand-light)] placeholder:text-fg-muted/70 aria-invalid:border-fg";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, "h-10", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(controlClass, "min-h-24 py-2", className)} {...props} />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "h-9", className)} {...props}>
      {children}
    </select>
  );
}

export function FieldError({
  id,
  children,
}: {
  id?: string;
  children?: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-fg">
      {children}
    </p>
  );
}

export function FieldHelp({
  id,
  children,
}: {
  id?: string;
  children?: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1 text-xs text-fg-muted">
      {children}
    </p>
  );
}

export function FormField({
  id,
  label,
  required,
  error,
  help,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  return (
    <div>
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      {children}
      <FieldHelp id={help ? helpId : undefined}>{help}</FieldHelp>
      <FieldError id={error ? errorId : undefined}>{error}</FieldError>
    </div>
  );
}
