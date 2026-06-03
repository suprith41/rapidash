"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Scale, ChevronDown } from "lucide-react";
import type { Rebalancing, RebalancingSuggestion } from "@/lib/types";
import { useSession } from "@/contexts/SessionContext";
import { cn } from "@/lib/utils";

type RebalancingCardProps = {
  rebalancing: Rebalancing;
};

const categoryColors: Record<string, string> = {
  "Large Cap Equity": "#635bff", // indigo
  "Mid Cap Equity": "#0ea5e9", // sky blue
  "Small Cap Equity": "#10b981", // emerald
  "Mutual Funds": "#f59e0b", // amber
  "Cash Reserve": "#6b7280", // gray
};

const actionStyles: Record<
  RebalancingSuggestion["action"],
  { label: string; className: string }
> = {
  hold: {
    label: "Hold",
    className: "bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]",
  },
  buy: {
    label: "Buy",
    className: "bg-[#dcfce7] text-[#16a34a] border-[#bbf7d0]",
  },
  sell: {
    label: "Sell",
    className: "bg-[#fee2e2] text-[#dc2626] border-[#fecaca]",
  },
};

export default function RebalancingCard({ rebalancing }: RebalancingCardProps) {
  const { session } = useSession();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  
  const total = Math.max(rebalancing.total_portfolio_value, 1);

  // Total adjustments needed is the sum of absolute differences
  const totalAdjustmentsValue = useMemo(() => {
    return rebalancing.suggestions.reduce(
      (sum, item) => sum + Math.abs(item.difference),
      0
    );
  }, [rebalancing.suggestions]);

  // Estimated time is max months to target from SIP plan or default to 6
  const estimatedTime = useMemo(() => {
    if (session?.sip_plan?.allocations && session.sip_plan.allocations.length > 0) {
      return Math.max(...session.sip_plan.allocations.map((a) => a.months_to_target));
    }
    return 6;
  }, [session]);

  return (
    <section className="h-full flex flex-col rounded-2xl bg-white p-6 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#635bff]">
          <Scale className="size-4" aria-hidden />
          Smart Rebalancing
        </div>
        <h3 className="mt-2 text-lg font-bold text-slate-800">
          Your Allocation Map
        </h3>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          {rebalancing.summary}
        </p>
      </div>

      {/* Suggestion Rows */}
      <div className="flex-1 space-y-4">
        {rebalancing.suggestions.map((item, index) => {
          const action = actionStyles[item.action];
          const color = categoryColors[item.category] ?? "#6b7280";
          const currentPct = (item.current_value / total) * 100;
          const idealPct = (item.ideal_value / total) * 100;
          const diffPct = ((item.current_value - item.ideal_value) / total) * 100;
          const isExpanded = expandedIndex === index;

          return (
            <div
              key={item.category}
              className="border-b border-slate-50 pb-4 last:border-b-0"
            >
              <button
                className="w-full text-left group"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                type="button"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr_1.2fr] gap-4 items-center">
                  
                  {/* Left side: colored square dot (10px) + category name + chevron */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-slate-700 text-sm group-hover:text-[#635bff] transition-colors truncate">
                      {item.category}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 text-slate-400 transition-transform duration-200 shrink-0",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>

                  {/* Center: dual progress bar */}
                  <div className="relative h-2 bg-[#f1f5f9] rounded-full overflow-visible">
                    {/* Current fill bar */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${currentPct}%` }}
                      className="absolute h-full rounded-full"
                      style={{ backgroundColor: color }}
                      transition={{ type: "spring", stiffness: 90, damping: 18 }}
                    />
                    {/* Ideal marker line */}
                    <div
                      style={{ left: `${idealPct}%` }}
                      className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-slate-800 z-10"
                      title={`Ideal: ${idealPct.toFixed(1)}%`}
                    />
                  </div>

                  {/* Right side: action badge + rupee amount */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border w-12 justify-center",
                        action.className
                      )}
                    >
                      {action.label}
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm min-w-[85px] text-right">
                      ₹{item.current_value.toLocaleString("en-IN")}
                    </span>
                  </div>

                </div>
              </button>

              {/* Action details expander */}
              <AnimatePresence initial={false}>
                {isExpanded ? (
                  <motion.div
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden text-xs mt-3 space-y-3"
                    exit={{ opacity: 0, height: 0 }}
                    initial={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Description in category color */}
                    <div
                      className="pt-3 border-t border-slate-50 font-medium leading-relaxed"
                      style={{ color: color }}
                    >
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

                    {/* Percentage comparison */}
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <span>Current: {currentPct.toFixed(1)}%</span>
                      <span className="text-slate-400">vs</span>
                      <span>Ideal: {idealPct.toFixed(1)}%</span>
                    </div>

                    {/* Gap visualization chart */}
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase mb-2">
                        <span>Target Deviation</span>
                        <span
                          className={cn(
                            "font-extrabold",
                            item.difference < 0 ? "text-red-500" : item.difference > 0 ? "text-green-600" : "text-slate-400"
                          )}
                        >
                          {item.difference > 0
                            ? `Surplus: +${diffPct.toFixed(1)}%`
                            : item.difference < 0
                            ? `Deficit: -${Math.abs(diffPct).toFixed(1)}%`
                            : "Aligned"}
                        </span>
                      </div>
                      
                      <div className="relative h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                        {/* Ideal reference line at 50% */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-slate-400 z-10" />
                        
                        {diffPct !== 0 && (
                          <div
                            style={{
                              left: diffPct < 0 ? `calc(50% - ${Math.min(50, Math.abs(diffPct * 5))}%)` : "50%",
                              width: `${Math.min(50, Math.abs(diffPct * 5))}%`
                            }}
                            className={cn(
                              "absolute h-full rounded-full",
                              diffPct < 0 ? "bg-red-500" : "bg-emerald-500"
                            )}
                          />
                        )}
                      </div>
                      <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-1">
                        <span>Underweight (-10%)</span>
                        <span>Ideal (0%)</span>
                        <span>Overweight (+10%)</span>
                      </div>
                    </div>

                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Summary row at bottom */}
      <div className="mt-6 bg-[#635bff] text-white rounded-xl p-4 shadow-[0_8px_20px_rgba(99,91,255,0.15)] flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-bold tracking-wide">
        <span>Total Adjustments: ₹{totalAdjustmentsValue.toLocaleString("en-IN")}</span>
        <span className="hidden sm:inline text-white/50">|</span>
        <span>Estimated Time to Rebalance: {estimatedTime} months</span>
      </div>
    </section>
  );
}
