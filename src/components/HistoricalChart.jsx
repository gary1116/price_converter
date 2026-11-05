
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

import { getHistoricalRates } from "../api";

const periods = [
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 }
];

export default function HistoricalChart({
  from = "USD",
  to = "INR",
  theme = "light"
}) {
  const [period, setPeriod] = useState(30);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reactively updates when the theme prop changes
  const isDark = theme === "dark";

  const chartColors = {
    grid: isDark ? "#354355" : "#e5e7eb",
    text: isDark ? "#9cabc0" : "#64748b",
    line: isDark ? "#a9d977" : "#2563eb",
    tooltipBg: isDark ? "#1e293b" : "#ffffff",
    tooltipBorder: isDark ? "#344256" : "#e5e7eb",
    tooltipText: isDark ? "#f1f5f9" : "#1b2638",
    cursor: isDark ? "#64748b" : "#94a3b8"
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        const data = await getHistoricalRates(
          from,
          to,
          period,
          controller.signal
        );

        if (!controller.signal.aborted) {
          setChartData(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError("Unable to load historical prices.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => controller.abort();
  }, [from, to, period]);

  const first = chartData[0]?.rate;
  const last = chartData.at(-1)?.rate;

  const change =
    first && last
      ? ((last - first) / first) * 100
      : null;

  return (
    <section className="history-panel">
      <div className="history-header">
        <div>
          <span className="history-eyebrow">
            HISTORICAL PERFORMANCE
          </span>

          <h2>{from} / {to}</h2>

          <p>Historical exchange rate trends</p>
        </div>

        <div className="history-periods">
          {periods.map((item) => (
            <button
              key={item.label}
              type="button"
              className={
                period === item.days ? "active" : ""
              }
              onClick={() => setPeriod(item.days)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="history-summary">
        <strong>
          {last == null
            ? "—"
            : last.toLocaleString("en-IN", {
                maximumFractionDigits: 4
              })}
          <small> {to}</small>
        </strong>

        {change !== null && (
          <span
            className={
              change >= 0
                ? "history-positive"
                : "history-negative"
            }
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </span>
        )}
      </div>

      {loading ? (
        <div className="history-message">
          Loading historical data...
        </div>
      ) : error ? (
        <div className="history-message">{error}</div>
      ) : chartData.length === 0 ? (
        <div className="history-message">
          No historical data available.
        </div>
      ) : (
        <div className="history-chart">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid
                stroke={chartColors.grid}
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tickFormatter={(date) => date.slice(5)}
                minTickGap={25}
                tick={{
                  fontSize: 11,
                  fill: chartColors.text
                }}
                axisLine={{ stroke: chartColors.grid }}
                tickLine={false}
              />

              <YAxis
                domain={["auto", "auto"]}
                width={65}
                tick={{
                  fontSize: 11,
                  fill: chartColors.text
                }}
                tickFormatter={(value) =>
                  Number(value).toFixed(2)
                }
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(value) => [
                  Number(value).toFixed(4),
                  `${from}/${to}`
                ]}
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  borderRadius: "10px",
                  color: chartColors.tooltipText,
                  boxShadow: isDark
                    ? "0 8px 24px rgba(0,0,0,0.25)"
                    : "0 8px 24px rgba(0,0,0,0.08)"
                }}
                labelStyle={{
                  color: chartColors.tooltipText,
                  fontWeight: 600
                }}
                itemStyle={{
                  color: chartColors.line
                }}
                cursor={{
                  stroke: chartColors.cursor,
                  strokeDasharray: "4 4"
                }}
              />

              <Line
                type="monotone"
                dataKey="rate"
                stroke={chartColors.line}
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: chartColors.tooltipBg,
                  strokeWidth: 2,
                  fill: chartColors.line
                }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="history-source">
        Source: Frankfurter · Daily reference rates
      </p>
    </section>
  );
}
