import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, required, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="font-sans text-sm text-text">
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            "h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 font-sans text-[15px] text-text placeholder:text-text-dim",
            "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            error && "border-danger focus-visible:ring-danger",
            className
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} role="alert" className="font-sans text-sm text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="font-sans text-sm text-text-dim">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
