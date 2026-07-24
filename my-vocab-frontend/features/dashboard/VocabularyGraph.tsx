"use client";

import { useState } from "react";
import { useGetProgressQuery } from "@/redux/services/authApi";

type Range = "week" | "month" | "3month" | "6month";

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const svgWidth = 600;
  const svgHeight = 180;
  const paddingLeft = 36;
  const paddingRight = 12;
  const paddingTop = 12;
  const paddingBottom = 40;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const barCount = data.length;
  const barGap = 4;
  const barWidth = Math.max(4, chartWidth / barCount - barGap);

  // Y-axis gridlines
  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const value = Math.round((maxCount / yTicks) * i);
    const y = paddingTop + chartHeight - (i / yTicks) * chartHeight;
    return { value, y };
  });

  // Format date label: show only Mon/day
  const formatLabel = (dateStr: string, total: number) => {
    const d = new Date(dateStr + "T00:00:00");
    if (total <= 7) {
      return d.toLocaleDateString("en-US", { weekday: "short" });
    }
    // For month view show only every 5th label
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const shouldShowLabel = (index: number, total: number) => {
    if (total <= 7) return true;
    if (total <= 31) return index === 0 || index === total - 1 || index % 5 === 0;
    if (total <= 90) return index === 0 || index === total - 1 || index % 10 === 0;
    // 6 months: ~every 14 days
    return index === 0 || index === total - 1 || index % 14 === 0;
  };

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-auto"
      style={{ overflow: "visible" }}
      aria-label="Vocabulary progress chart"
    >
      {/* Grid lines */}
      {gridLines.map(({ value, y }) => (
        <g key={y}>
          <line
            x1={paddingLeft}
            x2={paddingLeft + chartWidth}
            y1={y}
            y2={y}
            stroke="rgba(99,102,241,0.15)"
            strokeWidth={1}
            strokeDasharray={value === 0 ? "0" : "4 3"}
          />
          <text
            x={paddingLeft - 6}
            y={y + 4}
            textAnchor="end"
            fontSize={9}
            fill="rgba(148,163,184,0.8)"
          >
            {value}
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.map((item, i) => {
        const x =
          paddingLeft +
          (i / barCount) * chartWidth +
          (chartWidth / barCount - barWidth) / 2;
        const barH = item.count === 0 ? 2 : (item.count / maxCount) * chartHeight;
        const y = paddingTop + chartHeight - barH;
        const isToday = i === data.length - 1;

        return (
          <g key={item.date}>
            {/* Bar background (subtle) */}
            <rect
              x={x}
              y={paddingTop}
              width={barWidth}
              height={chartHeight}
              rx={3}
              fill="rgba(99,102,241,0.05)"
            />
            {/* Actual bar */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={3}
              fill={
                isToday
                  ? "url(#barGradientToday)"
                  : item.count > 0
                  ? "url(#barGradient)"
                  : "rgba(99,102,241,0.1)"
              }
            />
            {/* Count label above bar */}
            {item.count > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={8}
                fontWeight="bold"
                fill={isToday ? "#a5b4fc" : "rgba(148,163,184,0.9)"}
              >
                {item.count}
              </text>
            )}
            {/* Date label */}
            {shouldShowLabel(i, barCount) && (
              <text
                x={x + barWidth / 2}
                y={paddingTop + chartHeight + 16}
                textAnchor="middle"
                fontSize={9}
                fill={isToday ? "#a5b4fc" : "rgba(148,163,184,0.7)"}
                fontWeight={isToday ? "700" : "400"}
              >
                {formatLabel(item.date, barCount)}
              </text>
            )}
          </g>
        );
      })}

      {/* Gradient definitions */}
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#4338ca" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="barGradientToday" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function VocabularyGraph() {
  const [range, setRange] = useState<Range>("week");
  const { data, isLoading, isError } = useGetProgressQuery({ range });

  const totalInRange = data?.reduce((sum, d) => sum + d.count, 0) ?? 0;
  const activeDays = data?.filter((d) => d.count > 0).length ?? 0;
  const bestDay = data?.reduce(
    (best, d) => (d.count > best.count ? d : best),
    { date: "", count: 0 }
  );

  return (
    <article className="p-5 md:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-100 tracking-tight">
            Vocabulary Progress
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Words learned over time
          </p>
        </div>

        {/* Range Toggle */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 self-start sm:self-auto flex-wrap">
          {(["week", "month", "3month", "6month"] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              id={`progress-range-${r}`}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === r
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {r === "week" ? "7 Days" : r === "month" ? "30 Days" : r === "3month" ? "3 Months" : "6 Months"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700/50 text-center">
          <strong className="block text-xl font-extrabold text-indigo-400">
            {isLoading ? "—" : totalInRange}
          </strong>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
            Total learned
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700/50 text-center">
          <strong className="block text-xl font-extrabold text-emerald-400">
            {isLoading ? "—" : activeDays}
          </strong>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
            Active days
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700/50 text-center">
          <strong className="block text-xl font-extrabold text-violet-400">
            {isLoading ? "—" : (bestDay?.count ?? 0)}
          </strong>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
            Best day
          </span>
        </div>
      </div>

      {/* Chart area */}
      <div className="relative min-h-[160px] flex items-center justify-center">
        {isLoading && (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-xs">Loading progress…</span>
          </div>
        )}

        {isError && (
          <p className="text-xs text-red-400 text-center">
            Failed to load progress data.
          </p>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <div className="w-full">
            <BarChart data={data} />
          </div>
        )}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <p className="text-xs text-slate-500 text-center">
            No progress data available yet.
          </p>
        )}
      </div>

      {/* Today highlight */}
      {!isLoading && !isError && data && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
          <p className="text-xs text-slate-500">
            <span className="text-violet-300 font-semibold">Today</span>{" "}
            — {data[data.length - 1]?.count ?? 0} word
            {(data[data.length - 1]?.count ?? 0) !== 1 ? "s" : ""} learned
          </p>
        </div>
      )}
    </article>
  );
}
