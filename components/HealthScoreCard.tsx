"use client";

import { motion } from "framer-motion";
import type { HealthScore } from "@/lib/types";
import { cn } from "@/lib/utils";

type HealthScoreCardProps = {
  healthScore: HealthScore;
};

const colorStyles: Record<
  HealthScore["color"],
  {
    stroke: string;
    text: string;
    bg: string;
    bar: string;
    ring: string;
  }
> = {
  green: {
    stroke: "#10b981",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    bar: "bg-emerald-500",
    ring: "ring-emerald-100",
  },
  blue: {
    stroke: "#3b82f6",
    text: "text-blue-600",
    bg: "bg-blue-50",
    bar: "bg-blue-500",
    ring: "ring-blue-100",
  },
  amber: {
    stroke: "#f59e0b",
    text: "text-amber-600",
    bg: "bg-amber-50",
    bar: "bg-amber-500",
    ring: "ring-amber-100",
  },
  red: {
    stroke: "#ef4444",
    text: "text-red-600",
    bg: "bg-red-50",
    bar: "bg-red-500",
    ring: "ring-red-100",
  },
};

export default function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  const styles = colorStyles[healthScore.color] ?? colorStyles.blue;
  const score = Math.max(0, Math.min(100, healthScore.score));

  return (
    <section className="rounded-xl bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/[0.04] sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-center">
        <div className="flex flex-col items-center justify-center">
          <div className={cn("relative flex size-56 items-center justify-center rounded-full ring-8", styles.ring)}>
            <svg
              aria-hidden
              className="absolute inset-0 size-full -rotate-90"
              viewBox="0 0 120 120"
            >
              <circle
                cx="60"
                cy="60"
                fill="none"
                r="50"
                stroke="#e2e8f0"
                strokeLinecap="round"
                strokeWidth="10"
              />
              <motion.circle
                cx="60"
                cy="60"
                fill="none"
                initial={{ pathLength: 0 }}
                r="50"
                stroke={styles.stroke}
                strokeLinecap="round"
                strokeWidth="10"
                transition={{ type: "spring", stiffness: 70, damping: 18, delay: 0.15 }}
                animate={{ pathLength: score / 100 }}
              />
            </svg>

            <div className="relative text-center">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-bold tracking-[-0.03em] text-[#0a2540]"
                initial={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.35, delay: 0.1 }}
              >
                {score}
              </motion.div>
              <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#697386]">
                Health Score
              </div>
            </div>
          </div>

          <div className="mt-5 text-center">
            <div className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-bold", styles.bg, styles.text)}>
              Grade {healthScore.grade}
            </div>
            <div className="mt-2 text-xl font-bold tracking-[-0.02em] text-[#0a2540]">
              {healthScore.grade_label}
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#635bff]">
                Portfolio Health
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#0a2540]">
                Risk and allocation check
              </h3>
            </div>
            <p className="text-sm font-semibold text-[#425466]">
              Total value: Rs {healthScore.total_portfolio_value.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            {healthScore.breakdown.slice(0, 4).map((item, index) => {
              const pct = item.max > 0 ? Math.max(0, Math.min(100, (item.score / item.max) * 100)) : 0;

              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-slate-200 bg-[#f6f9fc] p-4"
                  initial={{ opacity: 0, y: 10 }}
                  key={item.label}
                  transition={{ duration: 0.35, delay: 0.12 + index * 0.08 }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#0a2540]">{item.label}</div>
                      <p className="mt-1 text-sm leading-6 text-[#425466]">{item.message}</p>
                    </div>
                    <div className="shrink-0 text-sm font-bold text-[#0a2540]">
                      {item.score}/{item.max}
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                      animate={{ width: `${pct}%` }}
                      className={cn("h-full rounded-full", styles.bar)}
                      initial={{ width: 0 }}
                      transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.2 + index * 0.08 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
