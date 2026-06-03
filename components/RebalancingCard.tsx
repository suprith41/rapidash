"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Scale } from "lucide-react";
import type { Rebalancing, RebalancingSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

type RebalancingCardProps = {
  rebalancing: Rebalancing;
};

const actionStyles: Record<
  RebalancingSuggestion["action"],
  { label: string; className: string }
> = {
  hold: {
    label: "Hold",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  buy: {
    label: "Buy",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  sell: {
    label: "Sell",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
};

export default function RebalancingCard({ rebalancing }: RebalancingCardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const total = Math.max(rebalancing.total_portfolio_value, 1);

  return (
    <section className="rounded-xl bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/[0.04] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#635bff]">
            <Scale className="size-4" aria-hidden />
            Smart Rebalancing
          </div>
          <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#0a2540]">
            Your allocation map
          </h3>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[#425466]">
          {rebalancing.summary}
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {rebalancing.suggestions.map((item, index) => {
          const action = actionStyles[item.action];
          const currentPct = (item.current_value / total) * 100;
          const idealPct = (item.ideal_value / total) * 100;
          const isExpanded = expandedIndex === index;

          return (
            <motion.button
              className="w-full rounded-lg border border-slate-200 bg-[#f6f9fc] p-4 text-left transition hover:border-slate-300"
              key={item.category}
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 + index * 0.06 }}
            >
              <div className="grid gap-3 lg:grid-cols-[1.2fr_auto_auto_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#0a2540]">{item.category}</div>
                  <div className="mt-1 text-xs font-medium text-[#697386]">
                    Click for action details
                  </div>
                </div>

                <div className="text-sm font-semibold text-[#0a2540]">
                  Current <span className="font-bold">₹{item.current_value.toLocaleString("en-IN")}</span>
                </div>

                <div className="text-sm font-semibold text-[#0a2540]">
                  Ideal <span className="font-bold">₹{item.ideal_value.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-start lg:justify-end">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1",
                      action.className
                    )}
                  >
                    {action.label}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="relative h-2 overflow-hidden rounded-full bg-slate-200">
                  <motion.div
                    animate={{ width: `${Math.max(0, Math.min(100, currentPct))}%` }}
                    className="absolute inset-y-0 left-0 rounded-full bg-slate-500/70"
                    initial={{ width: 0 }}
                    transition={{ type: "spring", stiffness: 90, damping: 18 }}
                  />
                  <motion.div
                    animate={{ width: `${Math.max(0, Math.min(100, idealPct))}%` }}
                    className="absolute inset-y-0 left-0 rounded-full border border-dashed border-[#635bff] bg-transparent"
                    initial={{ width: 0 }}
                    transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.05 }}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded ? (
                    <motion.div
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden text-sm leading-6 text-[#425466]"
                      exit={{ opacity: 0, height: 0 }}
                      initial={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="pt-1">
                        {item.action === "hold" ? (
                          <span>
                            This category is close to target. Keep the current allocation
                            steady for now.
                          </span>
                        ) : item.action === "buy" ? (
                          <span>
                            Increase this bucket by{" "}
                            <strong>₹{Math.abs(item.difference).toLocaleString("en-IN")}</strong>{" "}
                            to move toward the ideal mix.
                          </span>
                        ) : (
                          <span>
                            Reduce this bucket by{" "}
                            <strong>₹{Math.abs(item.difference).toLocaleString("en-IN")}</strong>{" "}
                            and redeploy toward underweight categories.
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
