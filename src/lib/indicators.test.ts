import { describe, it, expect } from "vitest";
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateVWAP,
  calculateVolumeMA,
  calculateATR,
  type Bar,
} from "./indicators";

const samplePrices = [10, 11, 12, 11, 10, 11, 12, 13, 14, 15, 14, 13, 14, 15, 16];

const sampleBars: Bar[] = [
  { t: 1, o: 10, h: 12, l: 9, c: 11, v: 100 },
  { t: 2, o: 11, h: 13, l: 10, c: 12, v: 150 },
  { t: 3, o: 12, h: 14, l: 11, c: 13, v: 200 },
  { t: 4, o: 13, h: 13.5, l: 11.5, c: 12, v: 120 },
  { t: 5, o: 12, h: 12.5, l: 9.5, c: 10, v: 180 },
  { t: 6, o: 10, h: 12, l: 9.8, c: 11.5, v: 140 },
  { t: 7, o: 11.5, h: 13, l: 11, c: 12.8, v: 160 },
  { t: 8, o: 12.8, h: 14.5, l: 12.5, c: 14, v: 220 },
  { t: 9, o: 14, h: 15.2, l: 13.8, c: 14.8, v: 190 },
  { t: 10, o: 14.8, h: 16, l: 14.5, c: 15.5, v: 250 },
  { t: 11, o: 15.5, h: 15.8, l: 13.9, c: 14.2, v: 210 },
  { t: 12, o: 14.2, h: 14.6, l: 13.1, c: 13.5, v: 170 },
  { t: 13, o: 13.5, h: 15, l: 13.3, c: 14.4, v: 180 },
  { t: 14, o: 14.4, h: 15.8, l: 14.2, c: 15.2, v: 230 },
  { t: 15, o: 15.2, h: 16.5, l: 15, c: 16.1, v: 260 },
];

describe("Technical Chart Indicators", () => {
  it("calculates SMA correctly", () => {
    const sma = calculateSMA(samplePrices, 5);
    expect(sma[0]).toBeNull();
    expect(sma[3]).toBeNull();
    // first 5: 10, 11, 12, 11, 10 -> average = 10.8
    expect(sma[4]).toBe(10.8);
    // next 5: 11, 12, 11, 10, 11 -> average = 11.0
    expect(sma[5]).toBe(11.0);
  });

  it("calculates EMA correctly with smoothing", () => {
    const ema = calculateEMA(samplePrices, 5);
    expect(ema[0]).toBeNull();
    expect(ema[4]).toBe(10.8);
    expect(typeof ema[5]).toBe("number");
    expect(ema[5]).toBeGreaterThan(10);
  });

  it("calculates RSI bounded between 0 and 100", () => {
    const closes = sampleBars.map((b) => b.c);
    const rsi = calculateRSI(closes, 5);
    const validRsi = rsi.filter((v): v is number => v !== null);
    expect(validRsi.length).toBeGreaterThan(0);
    validRsi.forEach((val) => {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    });
  });

  it("calculates MACD line, signal line and histogram", () => {
    const closes = samplePrices;
    const { macd, signal, histogram } = calculateMACD(closes, 3, 6, 3);
    expect(macd.length).toBe(closes.length);
    expect(signal.length).toBe(closes.length);
    expect(histogram.length).toBe(closes.length);
  });

  it("calculates Bollinger Bands with upper, middle and lower levels", () => {
    const bb = calculateBollingerBands(samplePrices, 5, 2);
    expect(bb.upper.length).toBe(samplePrices.length);
    expect(bb.middle.length).toBe(samplePrices.length);
    expect(bb.lower.length).toBe(samplePrices.length);

    // For valid indices, upper > middle > lower
    for (let i = 4; i < samplePrices.length; i++) {
      expect(bb.upper[i]!).toBeGreaterThanOrEqual(bb.middle[i]!);
      expect(bb.middle[i]!).toBeGreaterThanOrEqual(bb.lower[i]!);
    }
  });

  it("calculates VWAP correctly based on price and volume", () => {
    const vwap = calculateVWAP(sampleBars);
    expect(vwap.length).toBe(sampleBars.length);
    // First bar typical price: (12 + 9 + 11)/3 = 10.6667
    expect(vwap[0]).toBe(10.6667);
  });

  it("calculates Volume Moving Average", () => {
    const vma = calculateVolumeMA(sampleBars, 3);
    expect(vma[0]).toBeNull();
    expect(vma[1]).toBeNull();
    // first 3 vols: 100, 150, 200 -> average = 150
    expect(vma[2]).toBe(150);
  });

  it("calculates ATR for volatility tracking", () => {
    const atr = calculateATR(sampleBars, 5);
    const valid = atr.filter((v): v is number => v !== null);
    expect(valid.length).toBeGreaterThan(0);
    valid.forEach((val) => expect(val).toBeGreaterThan(0));
  });
});
