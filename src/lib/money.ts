import Big from "big.js";

/**
 * Money utilities using integer minor units (e.g. KES cents) and Big.js.
 * 1 KES = 100 cents.
 */

export interface Money {
  amountMinor: bigint; // Minor units, e.g. cents
  currency: string;
}

/**
 * Converts a decimal string or number to minor units (e.g. "150.50" KES -> 15050n cents).
 */
export function toMinorUnits(decimalAmount: string | number): bigint {
  const b = new Big(decimalAmount).times(100).round(0, Big.roundHalfUp);
  return BigInt(b.toFixed(0));
}

/**
 * Converts minor units (cents) to a decimal string (e.g. 15050n -> "150.50").
 */
export function fromMinorUnits(amountMinor: bigint | number): string {
  const b = new Big(amountMinor.toString()).div(100);
  return b.toFixed(2);
}

/**
 * Formats minor units for display (e.g. 15050n, 'KES' -> "KES 150.50").
 */
export function formatMoney(amountMinor: bigint | number, currency = "KES"): string {
  const decimalStr = fromMinorUnits(amountMinor);
  const [whole, fraction] = decimalStr.split(".");
  const formattedWhole = Number(whole).toLocaleString("en-KE");
  return `${currency} ${formattedWhole}.${fraction}`;
}

/**
 * Adds two minor unit amounts.
 */
export function addMoney(a: bigint, b: bigint): bigint {
  return a + b;
}

/**
 * Subtracts two minor unit amounts. Throws if underflow disallowed and result < 0.
 */
export function subtractMoney(a: bigint, b: bigint, allowNegative = true): bigint {
  const res = a - b;
  if (!allowNegative && res < 0n) {
    throw new Error("Insufficient balance: money amount cannot be negative");
  }
  return res;
}

/**
 * Calculates percentage change between two minor amounts using Big.js without float inaccuracies.
 */
export function calculateReturnPct(investedMinor: bigint, currentMinor: bigint): string {
  if (investedMinor <= 0n) return "0.00";
  const inv = new Big(investedMinor.toString());
  const cur = new Big(currentMinor.toString());
  const diff = cur.minus(inv);
  return diff.div(inv).times(100).toFixed(2);
}

/**
 * Calculates share quantity from money allocation and price:
 * quantity = minorAmount / (price * 100)
 */
export function calculateShareQuantity(minorAmount: bigint, sharePrice: number | string): string {
  const priceBig = new Big(sharePrice);
  if (priceBig.lte(0)) return "0";
  const amountBig = new Big(minorAmount.toString()).div(100);
  return amountBig.div(priceBig).round(6, Big.roundDown).toFixed(6);
}

/**
 * Computes estimated cost in minor units given quantity and share price.
 */
export function estimateCostMinor(quantity: number | string, sharePrice: number | string): bigint {
  const q = new Big(quantity);
  const p = new Big(sharePrice);
  const cost = q.times(p).times(100).round(0, Big.roundHalfUp);
  return BigInt(cost.toFixed(0));
}
