"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { cn } from "@/lib/utils";

type NetWorthPoint = {
  date: string;
  value: number;
};

type ChartView = "historical" | "forecast";

type NetWorthChartProps = {
  historicalData?: NetWorthPoint[];
  forecastData?: NetWorthPoint[];
};

const historicalMockData: NetWorthPoint[] = [
  { date: "Jan", value: 45000.0 },
  { date: "Feb", value: 46200.5 },
  { date: "Mar", value: 48900.2 },
  { date: "Apr", value: 50100.8 },
  { date: "May", value: 52010.62 },
];

const forecastMockData: NetWorthPoint[] = [
  { date: "May", value: 52010.62 },
  { date: "Jun", value: 54100.0 },
  { date: "Jul", value: 56500.0 },
  { date: "Aug", value: 59200.0 },
  { date: "Sep", value: 62400.0 },
];

const inrFormatter = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = payload[0].value;
  const numValue = typeof value === "number" ? value : Number(value);

  return (
    <div className="bg-[#635bff] text-white px-2.5 py-1.5 rounded-md text-xs font-semibold shadow-lg border-none">
      {payload[0].payload?.date}: {inrFormatter.format(numValue || 0)}
    </div>
  );
}

export default function NetWorthChart({
  historicalData = [],
  forecastData = [],
}: NetWorthChartProps) {
  const [view, setView] = useState<ChartView>("historical");

  const chartData = useMemo(() => {
    if (view === "historical") {
      return historicalData.length > 0 ? historicalData : historicalMockData;
    }
    return forecastData.length > 0 ? forecastData : forecastMockData;
  }, [forecastData, historicalData, view]);

  const latestValue = useMemo(() => {
    return chartData.at(-1)?.value ?? 52010.62;
  }, [chartData]);

  const formattedValue = useMemo(() => {
    return latestValue.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [latestValue]);

  const isForecast = view === "forecast";
  const stroke = isForecast ? "#2563eb" : "#635bff"; // blue vs indigo
  const strokeDash = isForecast ? "4 4" : undefined;
  const fillOpacity = isForecast ? 0.05 : 0.16;
  const fillUrl = isForecast ? "url(#blueGradient)" : "url(#indigoGradient)";
  const headerLabel = isForecast ? "Projected Annual Yield" : "Net Worth";

  const isSinglePoint = chartData.length === 1;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header Area */}
      <div className="p-6 pb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {headerLabel}
          </p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-800">
            ₹{formattedValue}
          </h2>
        </div>

        {/* View Switcher Pills */}
        <div className="flex rounded-full bg-slate-100/80 p-0.5" role="radiogroup">
          {[
            { value: "historical", label: "Timeline" },
            { value: "forecast", label: "Forecast" },
          ].map((option) => {
            const isActive = option.value === view;
            const activeBg = option.value === "forecast" ? "bg-[#2563eb]" : "bg-[#635bff]";
            const activeGlow = option.value === "forecast" ? "shadow-[0_3px_8px_rgba(37,99,235,0.2)]" : "shadow-[0_3px_8px_rgba(99,91,255,0.2)]";

            return (
              <button
                key={option.value}
                onClick={() => setView(option.value as ChartView)}
                className={cn(
                  "relative rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-200",
                  isActive ? "text-white" : "text-slate-500 hover:text-slate-800"
                )}
                type="button"
              >
                {isActive && (
                  <motion.span
                    className={cn("absolute inset-0 rounded-full", activeBg, activeGlow)}
                    layoutId="networth-view-toggle"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Area - Bleeds to Card Edges */}
      <div className="relative h-[200px] w-full overflow-hidden mt-4">
        {isSinglePoint ? (
          <div className="relative h-full w-full flex flex-col justify-center items-center px-6">
            {/* Horizontal dashed line */}
            <div className="absolute left-0 right-0 border-t border-dashed border-[#635bff]/40 top-1/2 -translate-y-1/2" />

            {/* Center dot (indigo circle) */}
            <div className="relative z-10 size-4 rounded-full bg-[#635bff] border-2 border-white shadow-[0_0_12px_rgba(99,91,255,0.4)] flex items-center justify-center cursor-pointer">
              {/* Label showing date and value */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#635bff] text-white px-2.5 py-1.5 rounded-md text-[10px] font-bold shadow-lg whitespace-nowrap">
                {chartData[0].date}: ₹{formattedValue}
              </div>
            </div>

            {/* X-axis date below the center dot */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-400">
              {chartData[0].date}
            </div>
          </div>
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={chartData} margin={{ bottom: 0, left: 0, right: 0, top: 5 }}>
              <defs>
                <linearGradient id="indigoGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#635bff" stopOpacity={fillOpacity} />
                  <stop offset="100%" stopColor="#635bff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="blueGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={fillOpacity} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>

              {isForecast && (
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={false}
                  width={20}
                  label={{
                    value: "Cumulative Projected Yield",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#94a3b8", fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }
                  }}
                />
              )}

              <XAxis
                axisLine={false}
                dataKey="date"
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 500 }}
                tickFormatter={(date) =>
                  ["Jan", "Mar", "May", "Jul", "Sep", "Nov"].includes(date) || isForecast ? date : ""
                }
                padding={{ left: 10, right: 10 }}
              />

              <Tooltip
                content={(props) => <ChartTooltip {...props} />}
                cursor={{ stroke: isForecast ? "#2563eb22" : "#635bff22", strokeWidth: 1 }}
              />

              <Area
                dataKey="value"
                fill={fillUrl}
                stroke={stroke}
                strokeDasharray={strokeDash}
                strokeWidth={2}
                type="monotone"
                isAnimationActive={true}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {isSinglePoint && !isForecast && (
        <div className="text-center pb-4 text-[10px] text-slate-400 italic shrink-0">
          Upload multiple statements to see your wealth journey
        </div>
      )}

      {isForecast && (
        <div className="text-center pb-4 text-[10px] text-slate-400 italic shrink-0">
          Projected at 1.5% annual yield — actual returns may vary
        </div>
      )}
    </div>
  );
}
