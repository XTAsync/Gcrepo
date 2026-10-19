import React, { useId } from "react";
import { toMinorUnits, fromMinorUnits } from "@/lib/money";

interface AmountInputProps {
  valueMinor: bigint;
  onChangeMinor: (minor: bigint) => void;
  currency?: string;
  minMinor?: bigint;
  maxMinor?: bigint;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function AmountInput({
  valueMinor,
  onChangeMinor,
  currency = "KES",
  minMinor = 0n,
  maxMinor,
  label = "Amount",
  error,
  disabled = false,
  className = "",
}: AmountInputProps) {
  const id = useId();
  const displayVal = valueMinor === 0n ? "" : fromMinorUnits(valueMinor);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      onChangeMinor(0n);
      return;
    }

    // Only allow numbers with at most 2 decimal places
    if (!/^\d*(\.\d{0,2})?$/.test(raw)) {
      return;
    }

    try {
      const minor = toMinorUnits(raw);
      onChangeMinor(minor);
    } catch {
      // ignore parse errors
    }
  };

  const isBelowMin = valueMinor > 0n && valueMinor < minMinor;
  const isAboveMax = maxMinor !== undefined && valueMinor > maxMinor;
  const validationError =
    error ||
    (isBelowMin
      ? `Minimum amount is ${currency} ${fromMinorUnits(minMinor)}`
      : isAboveMax
        ? `Maximum amount is ${currency} ${fromMinorUnits(maxMinor!)}`
        : undefined);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-[var(--text-muted)] tracking-wider uppercase font-mono"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <span
          className="absolute left-3.5 text-xs font-mono font-semibold text-[var(--text-muted)] select-none pointer-events-none"
          aria-hidden="true"
        >
          {currency}
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={displayVal}
          onChange={handleChange}
          disabled={disabled}
          placeholder="0.00"
          className="w-full h-12 pl-14 pr-4 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.04)] font-mono text-base font-medium text-[var(--text)] tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus)] disabled:opacity-50 min-h-[44px]"
          aria-invalid={Boolean(validationError)}
          aria-describedby={validationError ? `${id}-error` : undefined}
        />
      </div>
      {validationError && (
        <span id={`${id}-error`} className="text-xs font-mono text-[var(--negative)] mt-0.5" role="alert">
          {validationError}
        </span>
      )}
    </div>
  );
}
