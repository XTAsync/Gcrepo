import { useId, useMemo, useState } from "react";
import type { ClientBar, CandleRange } from "@/lib/candles-client";
import { CANDLE_RANGES } from "@/lib/candles-client";
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateVWAP,
  calculateVolumeMA,
  calculateATR,
} from "@/lib/indicators";
import { Table, BarChart2, Layers } from "lucide-react";

interface Props {
  bars: ClientBar[];
  currency: string;
  range: CandleRange;
  onRangeChange: (r: CandleRange) => void;
  loading?: boolean;
  unavailableReason?: string | null;
  height?: number;
  volumeHeight?: number;
}

export type ChartType = "candlestick" | "line" | "area";
export type IndicatorType =
  | "none"
  | "SMA"
  | "EMA"
  | "RSI"
  | "MACD"
  | "Bollinger"
  | "VWAP"
  | "VolumeMA"
  | "ATR";

const GAIN = "rgb(120,200,140)";
const LOSS = "rgb(220,120,120)";
const GOLD = "rgba(201,168,76,";

export function CandlestickChart({
  bars,
  currency,
  range,
  onRangeChange,
  loading = false,
  unavailableReason = null,
  height = 240,
  volumeHeight = 56,
}: Props) {
  const clipId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorType>("none");
  const [viewTable, setViewTable] = useState(false);

  const W = 640;
  const H = height;
  const VH = volumeHeight;

  // Indicators calculations
  const indicatorData = useMemo(() => {
    if (bars.length === 0) return null;
    const closes = bars.map((b) => b.c);
    return {
      sma: calculateSMA(closes, 14),
      ema: calculateEMA(closes, 14),
      rsi: calculateRSI(closes, 14),
      macd: calculateMACD(closes, 12, 26, 9),
      bollinger: calculateBollingerBands(closes, 20, 2),
      vwap: calculateVWAP(bars),
      volMa: calculateVolumeMA(bars, 20),
      atr: calculateATR(bars, 14),
    };
  }, [bars]);

  const scales = useMemo(() => {
    if (bars.length < 2) return null;
    let max = Math.max(...bars.map((b) => b.h));
    let min = Math.min(...bars.map((b) => b.l));

    // If Bollinger Bands or VWAP is on, expand scale
    if (selectedIndicator === "Bollinger" && indicatorData?.bollinger) {
      const validUpper = indicatorData.bollinger.upper.filter((v): v is number => v !== null);
      const validLower = indicatorData.bollinger.lower.filter((v): v is number => v !== null);
      if (validUpper.length) max = Math.max(max, ...validUpper);
      if (validLower.length) min = Math.min(min, ...validLower);
    } else if (selectedIndicator === "VWAP" && indicatorData?.vwap) {
      const validVwap = indicatorData.vwap.filter((v): v is number => v !== null);
      if (validVwap.length) {
        max = Math.max(max, ...validVwap);
        min = Math.min(min, ...validVwap);
      }
    }

    const range_ = max - min || 1;
    const maxVol = Math.max(...bars.map((b) => b.v), 1);
    return {
      min,
      max,
      maxVol,
      y: (v: number) => H - ((v - min) / range_) * (H * 0.88) - H * 0.06,
      vy: (v: number) => VH - (v / maxVol) * (VH - 4),
    };
  }, [bars, H, VH, selectedIndicator, indicatorData]);

  const slot = bars.length ? W / bars.length : W;
  const bodyW = Math.max(1.4, Math.min(slot * 0.62, 14));
  const active = hover != null ? bars[hover] : null;

  const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const fmtTime = (t: number) => {
    const d = new Date(t * 1000);
    return range === "1D" || range === "1W"
      ? d.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const onMove = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!bars.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const ratio = (clientX - rect.left) / rect.width;
    const idx = Math.max(0, Math.min(bars.length - 1, Math.floor(ratio * bars.length)));
    setHover(idx);
  };

  if (loading) {
    return (
      <div className="skeleton rounded-2xl w-full" style={{ height: height + volumeHeight + 70 }} />
    );
  }

  if (bars.length < 2) {
    return (
      <div
        className="glass rounded-2xl p-6 text-center flex flex-col items-center justify-center"
        style={{ minHeight: height }}
      >
        <p className="t-serif t-parch" style={{ fontSize: 13 }}>
          {unavailableReason ?? "No candlestick data for this symbol & range."}
        </p>
      </div>
    );
  }

  const { min, max, maxVol, y, vy } = scales!;
  const cxOf = (idx: number) => idx * slot + slot / 2;

  // Build SVG path for Line & Area
  const linePoints = bars.map((b, idx) => `${cxOf(idx)},${y(b.c)}`).join(" ");
  const areaPoints = `${cxOf(0)},${H} ${linePoints} ${cxOf(bars.length - 1)},${H}`;

  return (
    <div className="flex flex-col select-none">
      {/* Controls row: Chart Type, Indicator, Table View Toggle */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.04)] p-1 rounded-xl border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setChartType("candlestick")}
            className={`px-2 py-1 text-[10px] font-mono rounded-lg transition-colors cursor-pointer ${
              chartType === "candlestick"
                ? "bg-[var(--accent-gold)] text-[#2A1600] font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Candles
          </button>
          <button
            type="button"
            onClick={() => setChartType("line")}
            className={`px-2 py-1 text-[10px] font-mono rounded-lg transition-colors cursor-pointer ${
              chartType === "line"
                ? "bg-[var(--accent-gold)] text-[#2A1600] font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Line
          </button>
          <button
            type="button"
            onClick={() => setChartType("area")}
            className={`px-2 py-1 text-[10px] font-mono rounded-lg transition-colors cursor-pointer ${
              chartType === "area"
                ? "bg-[var(--accent-gold)] text-[#2A1600] font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Area
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={selectedIndicator}
            onChange={(e) => setSelectedIndicator(e.target.value as IndicatorType)}
            aria-label="Select Technical Indicator"
            className="text-[10px] font-mono bg-[rgba(255,255,255,0.04)] text-[var(--text)] border border-[var(--border)] rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--focus)] cursor-pointer"
          >
            <option value="none">No Indicator</option>
            <option value="SMA">SMA (14)</option>
            <option value="EMA">EMA (14)</option>
            <option value="RSI">RSI (14)</option>
            <option value="MACD">MACD (12,26,9)</option>
            <option value="Bollinger">Bollinger Bands (20,2)</option>
            <option value="VWAP">VWAP</option>
            <option value="VolumeMA">Volume MA (20)</option>
            <option value="ATR">ATR (14)</option>
          </select>

          <button
            type="button"
            onClick={() => setViewTable(!viewTable)}
            aria-pressed={viewTable}
            title={viewTable ? "Show visual chart" : "View data table for accessibility"}
            className="p-1.5 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text)] text-xs flex items-center gap-1 cursor-pointer"
          >
            {viewTable ? <BarChart2 size={14} /> : <Table size={14} />}
          </button>
        </div>
      </div>

      {/* Timeframe pills */}
      <div className="flex gap-1.5 mb-2.5">
        {CANDLE_RANGES.map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            aria-pressed={r === range}
            title={`Show the ${r} timeframe`}
            className="t-mono"
            style={{
              flex: 1,
              padding: "6px 0",
              borderRadius: 999,
              fontSize: 10,
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "all 160ms ease",
              border:
                r === range
                  ? `1px solid ${GOLD}0.7)`
                  : "1px solid rgba(255,255,255,0.08)",
              background:
                r === range
                  ? "linear-gradient(180deg, rgba(201,168,76,0.22), rgba(201,168,76,0.08))"
                  : "rgba(255,255,255,0.02)",
              color: r === range ? "var(--gold-200)" : "rgba(200,175,130,0.6)",
              fontWeight: r === range ? 600 : 400,
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* View as Table (Accessibility requirement) */}
      {viewTable ? (
        <div
          className="rounded-2xl border border-[var(--border)] overflow-x-auto bg-[rgba(255,255,255,0.02)]"
          style={{ maxHeight: height + volumeHeight + 20 }}
          tabIndex={0}
          aria-label="Price series table"
        >
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="bg-[rgba(7,12,22,0.9)] sticky top-0 border-b border-[var(--border)]">
              <tr>
                <th scope="col" className="p-2.5 text-[var(--text-muted)] font-medium">Date</th>
                <th scope="col" className="p-2.5 text-[var(--text-muted)] font-medium text-right">Open</th>
                <th scope="col" className="p-2.5 text-[var(--text-muted)] font-medium text-right">High</th>
                <th scope="col" className="p-2.5 text-[var(--text-muted)] font-medium text-right">Low</th>
                <th scope="col" className="p-2.5 text-[var(--text-muted)] font-medium text-right">Close</th>
                <th scope="col" className="p-2.5 text-[var(--text-muted)] font-medium text-right">Vol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {bars.slice().reverse().map((b) => (
                <tr key={b.t} className="hover:bg-[rgba(255,255,255,0.04)]">
                  <td className="p-2 text-[var(--text-muted)] whitespace-nowrap">{fmtTime(b.t)}</td>
                  <td className="p-2 text-right tabular-nums text-[var(--text)]">{fmt(b.o)}</td>
                  <td className="p-2 text-right tabular-nums text-[var(--positive)]">{fmt(b.h)}</td>
                  <td className="p-2 text-right tabular-nums text-[var(--negative)]">{fmt(b.l)}</td>
                  <td className="p-2 text-right tabular-nums font-semibold" style={{ color: b.c >= b.o ? GAIN : LOSS }}>
                    {fmt(b.c)}
                  </td>
                  <td className="p-2 text-right tabular-nums text-[var(--text-muted)]">{b.v.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Visual Chart (Candlestick / Line / Area + Volume + Crosshair) */
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ height, display: "block", overflow: "visible" }}
            onMouseMove={onMove}
            onTouchMove={onMove}
            onMouseLeave={() => setHover(null)}
            onTouchEnd={() => setHover(null)}
          >
            <defs>
              <linearGradient id={`${clipId}-gold-area`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map((pct) => (
              <line
                key={pct}
                x1="0"
                x2={W}
                y1={H * pct}
                y2={H * pct}
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="4 4"
              />
            ))}

            {/* Chart Rendering */}
            {chartType === "area" && (
              <polygon points={areaPoints} fill={`url(#${clipId}-gold-area)`} />
            )}

            {(chartType === "line" || chartType === "area") && (
              <polyline
                fill="none"
                stroke="#C9A84C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={linePoints}
              />
            )}

            {chartType === "candlestick" &&
              bars.map((b, idx) => {
                const cx = cxOf(idx);
                const isGain = b.c >= b.o;
                const col = isGain ? GAIN : LOSS;
                const yO = y(b.o);
                const yC = y(b.c);
                const top = Math.min(yO, yC);
                const h_ = Math.max(1.8, Math.abs(yC - yO));

                return (
                  <g key={b.t}>
                    {/* Wick */}
                    <line
                      x1={cx}
                      x2={cx}
                      y1={y(b.h)}
                      y2={y(b.l)}
                      stroke={col}
                      strokeWidth="1.2"
                      strokeOpacity="0.85"
                    />
                    {/* Body */}
                    <rect
                      x={cx - bodyW / 2}
                      y={top}
                      width={bodyW}
                      height={h_}
                      fill={col}
                      rx="1"
                    />
                  </g>
                );
              })}

            {/* Technical Overlay: SMA */}
            {selectedIndicator === "SMA" && indicatorData?.sma && (
              <polyline
                fill="none"
                stroke="#2ABFBF"
                strokeWidth="1.8"
                points={indicatorData.sma
                  .map((v, i) => (v !== null ? `${cxOf(i)},${y(v)}` : null))
                  .filter(Boolean)
                  .join(" ")}
              />
            )}

            {/* Technical Overlay: EMA */}
            {selectedIndicator === "EMA" && indicatorData?.ema && (
              <polyline
                fill="none"
                stroke="#F39C12"
                strokeWidth="1.8"
                points={indicatorData.ema
                  .map((v, i) => (v !== null ? `${cxOf(i)},${y(v)}` : null))
                  .filter(Boolean)
                  .join(" ")}
              />
            )}

            {/* Technical Overlay: Bollinger Bands */}
            {selectedIndicator === "Bollinger" && indicatorData?.bollinger && (
              <>
                <polyline
                  fill="none"
                  stroke="#3498DB"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  points={indicatorData.bollinger.upper
                    .map((v, i) => (v !== null ? `${cxOf(i)},${y(v)}` : null))
                    .filter(Boolean)
                    .join(" ")}
                />
                <polyline
                  fill="none"
                  stroke="#3498DB"
                  strokeWidth="1.5"
                  points={indicatorData.bollinger.middle
                    .map((v, i) => (v !== null ? `${cxOf(i)},${y(v)}` : null))
                    .filter(Boolean)
                    .join(" ")}
                />
                <polyline
                  fill="none"
                  stroke="#3498DB"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  points={indicatorData.bollinger.lower
                    .map((v, i) => (v !== null ? `${cxOf(i)},${y(v)}` : null))
                    .filter(Boolean)
                    .join(" ")}
                />
              </>
            )}

            {/* Technical Overlay: VWAP */}
            {selectedIndicator === "VWAP" && indicatorData?.vwap && (
              <polyline
                fill="none"
                stroke="#9B59B6"
                strokeWidth="1.8"
                points={indicatorData.vwap
                  .map((v, i) => (v !== null ? `${cxOf(i)},${y(v)}` : null))
                  .filter(Boolean)
                  .join(" ")}
              />
            )}

            {/* Crosshair Vertical & Horizontal Line */}
            {hover != null && (
              <>
                <line
                  x1={cxOf(hover)}
                  x2={cxOf(hover)}
                  y1="0"
                  y2={H}
                  stroke={`${GOLD}0.7)`}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                {active && (
                  <line
                    x1="0"
                    x2={W}
                    y1={y(active.c)}
                    y2={y(active.c)}
                    stroke={`${GOLD}0.5)`}
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}
              </>
            )}
          </svg>

          {/* Volume Panel */}
          <svg
            viewBox={`0 0 ${W} ${VH}`}
            className="w-full"
            style={{
              height: VH,
              display: "block",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              marginTop: 4,
            }}
          >
            {bars.map((b, idx) => {
              const cx = cxOf(idx);
              const isGain = b.c >= b.o;
              const barH = VH - vy(b.v);
              return (
                <rect
                  key={b.t}
                  x={cx - bodyW / 2}
                  y={vy(b.v)}
                  width={bodyW}
                  height={Math.max(1, barH)}
                  fill={isGain ? GAIN : LOSS}
                  fillOpacity="0.45"
                />
              );
            })}
            {hover != null && (
              <line
                x1={cxOf(hover)}
                x2={cxOf(hover)}
                y1="0"
                y2={VH}
                stroke={`${GOLD}0.7)`}
                strokeWidth="1"
              />
            )}
          </svg>
        </div>
      )}

      {/* Crosshair Readout & Attribution */}
      <div
        className="font-mono mt-2"
        style={{ fontSize: 10, color: "var(--text-muted)", minHeight: 32 }}
      >
        {active ? (
          <div className="glass-gold p-2.5 rounded-xl border border-[rgba(201,168,76,0.3)] bg-[rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">{fmtTime(active.t)}</span>
              <span style={{ color: active.c >= active.o ? GAIN : LOSS }} className="font-bold">
                {currency} {fmt(active.c)}
              </span>
            </div>
            <div className="text-[10px] text-[var(--parchment)] mt-1 flex flex-wrap gap-x-2.5">
              <span>O: {fmt(active.o)}</span>
              <span>H: {fmt(active.h)}</span>
              <span>L: {fmt(active.l)}</span>
              <span>C: {fmt(active.c)}</span>
              <span>Vol: {active.v.toLocaleString()}</span>
              {selectedIndicator !== "none" && hover !== null && (
                <span className="text-[var(--gold-300)]">
                  {selectedIndicator}:{" "}
                  {selectedIndicator === "SMA" && indicatorData?.sma?.[hover] !== null
                    ? fmt(indicatorData!.sma[hover]!)
                    : selectedIndicator === "EMA" && indicatorData?.ema?.[hover] !== null
                      ? fmt(indicatorData!.ema[hover]!)
                      : selectedIndicator === "RSI" && indicatorData?.rsi?.[hover] !== null
                        ? fmt(indicatorData!.rsi[hover]!)
                        : selectedIndicator === "VWAP" && indicatorData?.vwap?.[hover] !== null
                          ? fmt(indicatorData!.vwap[hover]!)
                          : selectedIndicator === "ATR" && indicatorData?.atr?.[hover] !== null
                            ? fmt(indicatorData!.atr[hover]!)
                            : "—"}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] px-1 text-[var(--text-muted)]">
            <span>{fmtTime(bars[0].t)}</span>
            <span>
              {currency} {fmt(min)} – {fmt(max)}
            </span>
            <span>{fmtTime(bars[bars.length - 1].t)}</span>
          </div>
        )}
      </div>

      {/* Chart Attribution */}
      <p className="text-[9px] font-mono text-[var(--text-muted)] text-right mt-1.5 opacity-60">
        TradingView Lightweight Charts
      </p>
    </div>
  );
}
