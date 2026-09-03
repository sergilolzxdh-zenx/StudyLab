import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="flex items-start gap-2.5 font-sans text-sm text-text-dim">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-invalid={!!error || undefined}
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 rounded-[4px] border border-border bg-surface accent-[var(--accent)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
              className
            )}
            {...props}
          />
          <span>{label}</span>
        </label>
        {error && (
          <p role="alert" className="font-sans text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
