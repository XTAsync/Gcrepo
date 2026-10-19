import React from "react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  icon: React.ReactNode;
  variant?: "ghost" | "glass" | "brass";
  size?: "sm" | "md" | "lg";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      "aria-label": ariaLabel,
      icon,
      variant = "glass",
      size = "md",
      className = "",
      ...props
    },
    ref,
  ) => {
    const sizeClasses = {
      sm: "w-9 h-9 p-1.5",
      md: "w-11 h-11 p-2.5 min-w-[44px] min-h-[44px]",
      lg: "w-12 h-12 p-3 min-w-[48px] min-h-[48px]",
    }[size];

    const variantClasses = {
      ghost: "hover:bg-[rgba(255,255,255,0.08)] text-[var(--text)]",
      glass:
        "border border-[var(--border)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text)]",
      brass:
        "border border-[var(--accent-gold)] bg-[linear-gradient(180deg,rgba(201,168,76,0.18),rgba(201,168,76,0.06))] hover:bg-[rgba(201,168,76,0.25)] text-[var(--gold-200)]",
    }[variant];

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        title={ariaLabel}
        className={`inline-flex items-center justify-center rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
