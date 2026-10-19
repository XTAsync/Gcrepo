export interface Bar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

/**
 * 1. Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
    }
    if (i >= period - 1) {
      result.push(Number((sum / period).toFixed(4)));
    } else {
      result.push(null);
    }
  }
  return result;
}

/**
 * 2. Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prevEma: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      const slice = data.slice(0, period);
      prevEma = slice.reduce((a, b) => a + b, 0) / period;
      result.push(Number(prevEma.toFixed(4)));
    } else if (prevEma !== null) {
      prevEma = data[i] * k + prevEma * (1 - k);
      result.push(Number(prevEma.toFixed(4)));
    }
  }
  return result;
}

/**
 * 3. Relative Strength Index (RSI)
 */
export function calculateRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (closes.length <= period) {
    return closes.map(() => null);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  result.push(...new Array(period).fill(null));
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push(avgLoss === 0 ? 100 : Number((100 - 100 / (1 + rs)).toFixed(2)));

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const currentRs = avgGain / avgLoss;
      result.push(Number((100 - 100 / (1 + currentRs)).toFixed(2)));
    }
  }

  return result;
}

/**
 * 4. Moving Average Convergence Divergence (MACD)
 */
export interface MACDResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MACDResult {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine.push(Number((fastEMA[i]! - slowEMA[i]!).toFixed(4)));
    } else {
      macdLine.push(null);
    }
  }

  // Calculate signal line (EMA of MACD)
  const validMacd = macdLine.filter((v): v is number => v !== null);
  const signalSlice = calculateEMA(validMacd, signalPeriod);

  const signalLine: (number | null)[] = [];
  const histogram: (number | null)[] = [];

  let signalIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
      histogram.push(null);
    } else {
      const sig = signalSlice[signalIdx++];
      signalLine.push(sig);
      if (sig !== null) {
        histogram.push(Number((macdLine[i]! - sig).toFixed(4)));
      } else {
        histogram.push(null);
      }
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

/**
 * 5. Bollinger Bands
 */
export interface BollingerBandsResult {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
}

export function calculateBollingerBands(
  closes: number[],
  period = 20,
  multiplier = 2,
): BollingerBandsResult {
  const middle = calculateSMA(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1 || middle[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = middle[i]!;
      const variance = slice.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      upper.push(Number((mean + multiplier * stdDev).toFixed(4)));
      lower.push(Number((mean - multiplier * stdDev).toFixed(4)));
    }
  }

  return { upper, middle, lower };
}

/**
 * 6. Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(bars: Bar[]): (number | null)[] {
  const result: (number | null)[] = [];
  let cumulativeTypicalPriceVolume = 0;
  let cumulativeVolume = 0;

  for (const bar of bars) {
    const typicalPrice = (bar.h + bar.l + bar.c) / 3;
    cumulativeTypicalPriceVolume += typicalPrice * bar.v;
    cumulativeVolume += bar.v;

    if (cumulativeVolume === 0) {
      result.push(null);
    } else {
      result.push(Number((cumulativeTypicalPriceVolume / cumulativeVolume).toFixed(4)));
    }
  }

  return result;
}

/**
 * 7. Volume Moving Average (Volume MA)
 */
export function calculateVolumeMA(bars: Bar[], period = 20): (number | null)[] {
  const volumes = bars.map((b) => b.v);
  return calculateSMA(volumes, period);
}

/**
 * 8. Average True Range (ATR)
 */
export function calculateATR(bars: Bar[], period = 14): (number | null)[] {
  if (bars.length < period) {
    return bars.map(() => null);
  }

  const trueRanges: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i === 0) {
      trueRanges.push(bars[i].h - bars[i].l);
    } else {
      const prevClose = bars[i - 1].c;
      const tr = Math.max(
        bars[i].h - bars[i].l,
        Math.abs(bars[i].h - prevClose),
        Math.abs(bars[i].l - prevClose),
      );
      trueRanges.push(tr);
    }
  }

  const result: (number | null)[] = [];
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(...new Array(period - 1).fill(null));
  result.push(Number(atr.toFixed(4)));

  for (let i = period; i < bars.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    result.push(Number(atr.toFixed(4)));
  }

  return result;
}
