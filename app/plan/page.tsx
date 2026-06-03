"use client";

import React, { useState, useMemo } from "react";
import { Plus, Minus, TrendingUp, Info } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { useSession } from "@/contexts/SessionContext";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import type {
  Rebalancing,
  RebalancingSuggestion,
  SipAllocation,
  SipPlan,
} from "@/lib/types";

const RECOMMENDED_FUNDS: Record<
  string,
  {
    name: string;
    isin: string;
    category: string;
    min_sip: number;
  }[]
> = {
  large_cap_equity: [
    {
      name: "Mirae Asset Large Cap Fund",
      isin: "INF769K01010",
      category: "Large Cap",
      min_sip: 1000,
    },
    {
      name: "Axis Bluechip Fund",
      isin: "INF846K01EW2",
      category: "Large Cap",
      min_sip: 500,
    },
  ],
  mid_cap_equity: [
    {
      name: "Kotak Emerging Equity Fund",
      isin: "INF174K01LS2",
      category: "Mid Cap",
      min_sip: 1000,
    },
    {
      name: "HDFC Mid-Cap Opportunities Fund",
      isin: "INF179K01VQ3",
      category: "Mid Cap",
      min_sip: 500,
    },
  ],
  small_cap_equity: [
    {
      name: "SBI Small Cap Fund",
      isin: "INF200K01VF3",
      category: "Small Cap",
      min_sip: 500,
    },
    {
      name: "Nippon India Small Cap Fund",
      isin: "INF204K01U35",
      category: "Small Cap",
      min_sip: 100,
    },
  ],
  mutual_funds: [
    {
      name: "Parag Parikh Flexi Cap Fund",
      isin: "INF879O01019",
      category: "Flexi Cap",
      min_sip: 1000,
    },
    {
      name: "HDFC Flexi Cap Fund",
      isin: "INF179K01BC6",
      category: "Flexi Cap",
      min_sip: 500,
    },
  ],
};

const categoryBadgeColors: Record<string, string> = {
  "Large Cap": "bg-indigo-50 text-indigo-700 border-indigo-100",
  "Mid Cap": "bg-sky-50 text-sky-700 border-sky-100",
  "Small Cap": "bg-amber-50 text-amber-700 border-amber-100",
  "Flexi Cap": "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  style: "currency",
});

function buildSipPlan(
  rebalancing: Rebalancing,
  monthlyBudget: number
): SipPlan {
  const buySuggestions: RebalancingSuggestion[] = rebalancing.suggestions.filter(
    (s) => s.action === "buy"
  );

  if (!buySuggestions.length || monthlyBudget <= 0) {
    return {
      monthly_budget: monthlyBudget,
      allocations: [],
      message: "Your portfolio is well balanced or budget is zero. No SIP adjustments needed.",
      total_monthly_sip: 0,
    };
  }

  const totalDeficit = buySuggestions.reduce(
    (sum, suggestion) => sum + Math.abs(suggestion.difference),
    0
  );

  const allocations: SipAllocation[] = [];

  buySuggestions.forEach((suggestion) => {
    const categoryKey = suggestion.category.toLowerCase().replace(/ /g, "_");
    const weight = totalDeficit > 0 ? Math.abs(suggestion.difference) / totalDeficit : 0;
    let monthlyAmount = Math.round((monthlyBudget * weight) / 100) * 100;
    monthlyAmount = Math.max(monthlyAmount, 500);

    const funds = RECOMMENDED_FUNDS[categoryKey] ?? [];
    const recommendedFund = funds[0];

    if (recommendedFund) {
      allocations.push({
        category: suggestion.category,
        monthly_amount: monthlyAmount,
        fund_name: recommendedFund.name,
        fund_isin: recommendedFund.isin,
        fund_category: recommendedFund.category,
        min_sip: recommendedFund.min_sip,
        months_to_target:
          monthlyAmount > 0
            ? Math.round(Math.abs(suggestion.difference) / monthlyAmount)
            : 0,
        action_label: `Start ${inrFormatter.format(monthlyAmount)}/month SIP`,
      });
    }
  });

  const totalMonthlySip = allocations.reduce(
    (sum, allocation) => sum + allocation.monthly_amount,
    0
  );

  return {
    monthly_budget: monthlyBudget,
    total_monthly_sip: totalMonthlySip,
    allocations,
    message: `Invest ${inrFormatter.format(totalMonthlySip)}/month across ${allocations.length} funds to reach ideal allocation`,
  };
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = payload[0].value;
  const numValue = typeof value === "number" ? value : Number(value);

  return (
    <div className="bg-[#635bff] text-white px-2.5 py-1.5 rounded-md text-xs font-semibold shadow-lg border-none">
      {payload[0].payload.month}: {inrFormatter.format(numValue || 0)}
    </div>
  );
}

export default function PlanPage() {
  const { session } = useSession();
  const [budget, setBudget] = useState<number>(5000);

  const plan = useMemo(() => {
    if (!session?.rebalancing) return null;
    return buildSipPlan(session.rebalancing, budget);
  }, [session, budget]);

  const projectionData = useMemo(() => {
    if (!plan) return [];
    const monthlySip = plan.total_monthly_sip ?? 0;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let accumulated = 0;
    return months.map((month) => {
      accumulated += monthlySip;
      return {
        month,
        amount: accumulated,
      };
    });
  }, [plan]);

  const maxMonthsToTarget = useMemo(() => {
    if (!plan || plan.allocations.length === 0) return 0;
    return Math.max(...plan.allocations.map((a) => a.months_to_target));
  }, [plan]);

  if (!session) return null;

  if (!session.rebalancing) {
    return (
      <DashboardLayout title="SIP Plan">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
            <p className="text-slate-500 text-sm">
              No active SIP targets or rebalancing data configured for this statement.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="SIP Plan">
      <div className="space-y-10 pb-12">
        {/* TOP SECTION: Calculator style header */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#635bff] mb-1">
            <TrendingUp className="size-4" />
            Your Investment Plan
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Based on your current portfolio gaps
          </h2>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setBudget((b) => Math.max(500, b - 1000))}
              className="size-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-[#635bff] hover:text-[#635bff] transition"
              type="button"
            >
              <Minus className="size-4" />
            </button>
            
            <div className="flex items-baseline text-[#635bff] font-black tracking-tight text-3xl">
              <span className="mr-1">₹</span>
              <input
                type="text"
                value={budget.toLocaleString("en-IN")}
                onChange={(e) => {
                  const val = Number(e.target.value.replace(/[^\d]/g, "")) || 0;
                  setBudget(val);
                }}
                className="w-36 text-center bg-transparent border-b-2 border-dashed border-[#635bff]/20 focus:border-[#635bff] outline-none px-1 font-extrabold"
              />
              <span className="text-xs font-bold text-slate-400 ml-1">/month</span>
            </div>

            <button
              onClick={() => setBudget((b) => b + 1000)}
              className="size-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-[#635bff] hover:text-[#635bff] transition"
              type="button"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {/* MIDDLE SECTION — 2 columns */}
        {plan && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Fund Allocations */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 pl-1">
                Where to invest
              </h3>

              {plan.allocations.length > 0 ? (
                <div className="space-y-4">
                  {plan.allocations.map((allocation) => {
                    const badgeClass =
                      categoryBadgeColors[allocation.fund_category] ??
                      "bg-slate-50 text-slate-700 border-slate-200";

                    // Speed/months to target representation on progress bar
                    // Closer to target (fewer months) fills up more
                    const progressVal = Math.max(
                      8,
                      Math.min(100, (12 / Math.max(1, allocation.months_to_target)) * 100)
                    );

                    return (
                      <div
                        key={allocation.fund_isin}
                        className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm leading-snug">
                              {allocation.fund_name}
                            </h4>
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}
                              >
                                {allocation.fund_category}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="font-extrabold text-[#635bff] text-base">
                              {inrFormatter.format(allocation.monthly_amount)}
                            </span>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                              Monthly SIP
                            </div>
                          </div>
                        </div>

                        {/* Progress bar showing months to target */}
                        <div className="mt-4">
                          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 mb-1.5">
                            <span>Timeline to target</span>
                            <span className="text-[#635bff] font-bold">
                              {allocation.months_to_target} {allocation.months_to_target === 1 ? "month" : "months"}
                            </span>
                          </div>
                          
                          <div className="h-1.5 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${progressVal}%` }}
                              className="h-full bg-[#635bff] rounded-full transition-all duration-500"
                            />
                          </div>
                        </div>

                        {/* Min SIP Note in gray */}
                        <div className="flex items-center gap-1 mt-3 text-[10px] text-slate-400">
                          <Info className="size-3 text-slate-300" />
                          <span>
                            Min SIP note: Minimum {inrFormatter.format(allocation.min_sip)} to start.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm">
                  Increase your budget to see mutual fund allocations.
                </div>
              )}
            </div>

            {/* Right Column: 12-Month Projection */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 pl-1">
                12-Month Projection
              </h3>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <div className="mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Cumulative Investment
                  </div>
                  <div className="text-xl font-bold text-slate-800 mt-0.5">
                    {inrFormatter.format((plan.total_monthly_sip ?? 0) * 12)} after 1 year
                  </div>
                </div>

                <div className="h-[240px] w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={projectionData}
                      margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 500 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 500 }}
                        tickFormatter={(val) => `₹${val / 1000}k`}
                      />
                      <Tooltip
                        content={(props) => <ChartTooltip {...props} />}
                        cursor={{ fill: "#f8fafc" }}
                      />
                      <Bar
                        dataKey="amount"
                        fill="#635bff"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM SECTION: Summary strip */}
        {plan && plan.allocations.length > 0 && (
          <div className="bg-[#635bff] text-white rounded-2xl p-5 shadow-[0_8px_30px_rgba(99,91,255,0.16)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-bold tracking-wide text-center sm:text-left leading-relaxed">
              Invest {inrFormatter.format(plan.total_monthly_sip ?? 0)}/month across{" "}
              {plan.allocations.length}{" "}
              {plan.allocations.length === 1 ? "fund" : "funds"} → reach ideal
              allocation in {maxMonthsToTarget} {maxMonthsToTarget === 1 ? "month" : "months"}
            </div>
            
            <Link
              href="/dashboard"
              className="px-5 py-2 bg-white text-[#635bff] hover:bg-slate-50 rounded-xl text-xs font-black tracking-wide transition shadow-sm"
            >
              View Overview
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
