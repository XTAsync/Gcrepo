import React from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { formatMoney } from "@/lib/money";

interface PriceProps {
  amountMinor: bigint | number;
  currency?: string;
  className?: string;
}

export function Price({ amountMinor, currency = "KES", className = "" }: PriceProps) {
  return (
    <span
      className={`tabular-nums font-mono font-medium ${className}`}
      aria-label={`${currency} ${formatMoney(amountMinor, "")}`}
    >
      {formatMoney(amountMinor, currency)}
    </span>
  );
}

interface PriceChangeProps {
  changePct: number;
  className?: string;
  showSign?: boolean;
}

/**
 * Accessible Price Change:
 * Price direction is NEVER shown by colour alone:
 * always includes an arrow or sign and a clear aria-label.
 */
export function PriceChange({
  changePct,
  className = "",
  showSign = true,
}: PriceChangeProps) {
  const isPositive = changePct > 0;
  const isNegative = changePct < 0;
  const isZero = changePct === 0;

  const directionText = isPositive ? "up" : isNegative ? "down" : "unchanged";
  const absValue = Math.abs(changePct).toFixed(2);
  const ariaLabel = `${directionText} ${absValue} percent`;

  const colorClass = isPositive
    ? "text-[var(--positive)]"
    : isNegative
      ? "text-[var(--negative)]"
      : "text-[var(--text-muted)]";

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono tabular-nums text-xs font-semibold ${colorClass} ${className}`}
      aria-label={ariaLabel}
    >
      {isPositive && <ArrowUp size={12} aria-hidden="true" />}
      {isNegative && <ArrowDown size={12} aria-hidden="true" />}
      {isZero && <Minus size={12} aria-hidden="true" />}
      <span>
        {showSign && isPositive ? "+" : ""}
        {changePct.toFixed(2)}%
      </span>
    </span>
  );
}
