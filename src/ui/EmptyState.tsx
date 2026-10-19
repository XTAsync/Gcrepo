import React from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] ${className}`}
    >
      {icon && (
        <div className="mb-4 text-[var(--accent-gold)] opacity-80" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-lg font-medium text-[var(--text)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="btn-brass text-xs px-5 py-2.5 min-h-[44px] cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
