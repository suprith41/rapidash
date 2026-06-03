"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { HealthScore } from "@/lib/types";

type HealthScoreCardProps = {
  healthScore: HealthScore;
};

export default function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  const score = healthScore.score ?? 55;
  const grade = healthScore.grade ?? "C";
  const gradeLabel = healthScore.grade_label ?? "Fair";
  const circleRadius = 40;
  const circumference = 2 * Math.PI * circleRadius; // ~251.3

  // Map dynamic breakdown categories, falling back to spec-aligned values
  const breakdownRows = useMemo(() => {
    const defaults: Record<string, { score: number; max: number }> = {
      "Diversification": { score: 14, max: 30 },
      "Cash Utilization": { score: 25, max: 25 },
      "Sector Balance": { score: 0, max: 25 },
      "Portfolio Quality": { score: 16, max: 20 },
    };

    if (healthScore.breakdown) {
      healthScore.breakdown.forEach((item) => {
        // Match label strings or sub-strings
        const labelKey = Object.keys(defaults).find(
          (k) => k.toLowerCase().includes(item.label.toLowerCase()) || item.label.toLowerCase().includes(k.toLowerCase())
        );
        if (labelKey) {
          defaults[labelKey].score = item.score;
          defaults[labelKey].max = item.max;
        }
      });
    }

    return Object.entries(defaults).map(([label, val]) => ({
      label,
      score: val.score,
      max: val.max,
    }));
  }, [healthScore.breakdown]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col items-center">
      {/* Mini Circular Arc (120px diameter) */}
      <div className="relative flex items-center justify-center w-[120px] h-[120px]">
        <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
          <circle
            cx="50"
            cy="50"
            r={circleRadius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth="6"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={circleRadius}
            fill="transparent"
            stroke="#635bff"
            strokeWidth="6"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference * (1 - score / 100),
            }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-3xl font-extrabold text-slate-800">{score}</div>
      </div>

      {/* Grade Label */}
      <span className="mt-3 text-sm font-bold text-slate-700">
        Grade {grade} — {gradeLabel}
      </span>

      {/* 4 Breakdown rows in compact single-line format */}
      <div className="w-full mt-6 space-y-4">
        {breakdownRows.map((row) => {
          const pct = row.max > 0 ? (row.score / row.max) * 100 : 0;
          return (
            <div key={row.label} className="flex items-center justify-between text-xs gap-3">
              {/* Category Label (fixed width) */}
              <span className="w-28 font-medium text-slate-400 truncate">
                {row.label}
              </span>
              
              {/* Score label */}
              <span className="w-10 font-bold text-slate-700 text-right shrink-0">
                {row.score}/{row.max}
              </span>

              {/* Progress Bar (6px height, rounded, indigo fill) */}
              <div className="flex-1 h-[6px] bg-slate-100 rounded-full overflow-hidden shrink-0">
                <motion.div
                  className="h-full bg-[#635bff] rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
