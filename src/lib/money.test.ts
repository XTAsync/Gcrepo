import { describe, it, expect } from "vitest";
import {
  toMinorUnits,
  fromMinorUnits,
  formatMoney,
  addMoney,
  subtractMoney,
  calculateReturnPct,
  calculateShareQuantity,
  estimateCostMinor,
} from "./money";

describe("money math and integer minor units", () => {
  it("converts decimal amount to minor units correctly", () => {
    expect(toMinorUnits("100.50")).toBe(10050n);
    expect(toMinorUnits(100.5)).toBe(10050n);
    expect(toMinorUnits("0.05")).toBe(5n);
    expect(toMinorUnits("0.00")).toBe(0n);
  });

  it("converts minor units back to decimal string", () => {
    expect(fromMinorUnits(10050n)).toBe("100.50");
    expect(fromMinorUnits(5n)).toBe("0.05");
    expect(fromMinorUnits(0n)).toBe("0.00");
  });

  it("formats minor units cleanly with currency code", () => {
    expect(formatMoney(15000000n, "KES")).toBe("KES 150,000.00");
    expect(formatMoney(25050n, "KES")).toBe("KES 250.50");
  });

  it("performs integer addition and subtraction without floating point drift", () => {
    const a = 10000n; // KES 100.00
    const b = 2550n; // KES 25.50
    expect(addMoney(a, b)).toBe(12550n);
    expect(subtractMoney(a, b)).toBe(7450n);
    expect(() => subtractMoney(b, a, false)).toThrow(/Insufficient balance/);
  });

  it("calculates accurate return percentages without float distortion", () => {
    expect(calculateReturnPct(10000n, 12000n)).toBe("20.00");
    expect(calculateReturnPct(10000n, 8500n)).toBe("-15.00");
    expect(calculateReturnPct(10000n, 10000n)).toBe("0.00");
    expect(calculateReturnPct(0n, 10000n)).toBe("0.00");
  });

  it("calculates exact share quantities and estimated costs", () => {
    // KES 1,000.00 at KES 20.00 per share = 50.000000 shares
    expect(calculateShareQuantity(100000n, "20.00")).toBe("50.000000");
    // 50 shares at KES 20.00 = 100000n cents
    expect(estimateCostMinor("50", "20.00")).toBe(100000n);
  });
});
