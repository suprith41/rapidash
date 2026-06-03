"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
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
  { date: "Jan", value: 1840000 },
  { date: "Feb", value: 1975000 },
  { date: "Mar", value: 2130000 },
  { date: "Apr", value: 2285000 },
  { date: "May", value: 2460000 },
  { date: "Jun", value: 2595000 },
  { date: "Jul", value: 2810000 },
  { date: "Aug", value: 2980000 },
  { date: "Sep", value: 3150000 },
  { date: "Oct", value: 3375000 },
  { date: "Nov", value: 3520000 },
  { date: "Dec", value: 3740000 },
];

const forecastMockData: NetWorthPoint[] = [
  { date: "Jan", value: 18500 },
  { date: "Feb", value: 20200 },
  { date: "Mar", value: 22400 },
  { date: "Apr", value: 24100 },
  { date: "May", value: 26300 },
  { date: "Jun", value: 28800 },
  { date: "Jul", value: 31600 },
  { date: "Aug", value: 34200 },
  { date: "Sep", value: 37100 },
  { date: "Oct", value: 39900 },
  { date: "Nov", value: 42800 },
  { date: "Dec", value: 46200 },
];

const viewOptions: Array<{ value: ChartView; label: string }> = [
  { value: "historical", label: "Historical Net Worth" },
  { value: "forecast", label: "12-Month Dividend Forecast" },
];

const inrFormatter = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});

const compactInrFormatter = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 1,
  notation: "compact",
  style: "currency",
});

function ChartTooltip({
  active,
  label,
  payload,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
      <div className="text-xs font-medium text-[#64748b]">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[#0a2540]">
        {inrFormatter.format(Number(payload[0].value ?? 0))}
      </div>
    </div>
  );
}

function ViewSwitcher({
  activeView,
  onChange,
}: {
  activeView: ChartView;
  onChange: (view: ChartView) => void;
}) {
  return (
    <div
      aria-label="Net worth chart view"
      className="flex rounded-full border border-slate-200 bg-[#f6f9fc] p-1"
      role="radiogroup"
    >
      {viewOptions.map((option) => {
        const isActive = option.value === activeView;

        return (
          <button
            aria-checked={isActive}
            className={cn(
              "relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              isActive ? "text-white" : "text-[#425466] hover:text-[#0a2540]"
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            role="radio"
            type="button"
          >
            {isActive ? (
              <motion.span
                className="absolute inset-0 -z-10 rounded-full bg-[#635bff] shadow-[0_8px_18px_rgba(99,91,255,0.22)]"
                layoutId="net-worth-view-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="relative z-10 hidden sm:inline">{option.label}</span>
            <span className="relative z-10 sm:hidden">
              {option.value === "historical" ? "History" : "Forecast"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function NetWorthAreaChart({
  data,
  view,
}: {
  data: NetWorthPoint[];
  view: ChartView;
}) {
  const isForecast = view === "forecast";
  const gradientId = isForecast ? "forecastNetWorthGradient" : "netWorthGradient";
  const stroke = isForecast ? "#2563eb" : "#635bff";

  return (
    <ResponsiveContainer height={280} minWidth={0} width="100%">
      <AreaChart data={data} margin={{ bottom: 0, left: 0, right: 10, top: 12 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="0%"
              stopColor={isForecast ? "#2563eb" : "#635bff"}
              stopOpacity={0.22}
            />
            <stop
              offset="100%"
              stopColor={isForecast ? "#2563eb" : "#635bff"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e6ebf1" strokeDasharray="3 3" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="date"
          tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
          tickLine={false}
        />
        <YAxis
          axisLine={false}
          tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
          tickFormatter={(value) => compactInrFormatter.format(Number(value))}
          tickLine={false}
          width={82}
        />
        <Tooltip
          content={(props) => <ChartTooltip {...props} />}
          cursor={{ stroke: "#635bff33" }}
        />
        <Area
          dataKey="value"
          fill={`url(#${gradientId})`}
          fillOpacity={1}
          isAnimationActive={false}
          stroke={stroke}
          strokeDasharray={isForecast ? "6 6" : undefined}
          strokeLinecap="round"
          strokeWidth={3}
          type="monotone"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function NetWorthChart({
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
  const latestValue = chartData.at(-1)?.value ?? 0;

  return (
    <div className="flex h-full min-h-[20rem] flex-col rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-[#f8faff] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#635bff]">
            Portfolio
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-[#0a2540]">
            {viewOptions.find((option) => option.value === view)?.label}
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[#425466]">
            Hover the line to inspect the exact value. Switch between history and forecast to
            compare the story visually.
          </p>
        </div>
        <ViewSwitcher activeView={view} onChange={setView} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-[#f6f9fc] px-3 py-1.5 text-xs font-semibold text-[#425466]">
          Latest value: {inrFormatter.format(latestValue)}
        </span>
        <span className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-xs font-semibold text-[#4f46e5]">
          Interactive chart
        </span>
      </div>

      <div className="relative mt-5 min-h-[16rem] flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0"
            exit={{ opacity: 0, y: -12 }}
            initial={{ opacity: 0, y: 12 }}
            key={view}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <NetWorthAreaChart data={chartData} view={view} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default memo(NetWorthChart);
