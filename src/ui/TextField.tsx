import React, { useId } from "react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, className = "", id: customId, ...props }, ref) => {
    const generatedId = useId();
    const id = customId || generatedId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor={id}
          className="text-xs font-medium text-[var(--text-muted)] tracking-wider uppercase font-mono"
        >
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          className={`w-full h-11 px-3.5 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.04)] font-sans text-sm text-[var(--text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus)] disabled:opacity-50 min-h-[44px] ${
            error ? "border-[var(--negative)]" : ""
          } ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        {hint && !error && (
          <span id={`${id}-hint`} className="text-xs text-[var(--text-muted)]">
            {hint}
          </span>
        )}
        {error && (
          <span id={`${id}-error`} className="text-xs font-mono text-[var(--negative)]" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  },
);

TextField.displayName = "TextField";
