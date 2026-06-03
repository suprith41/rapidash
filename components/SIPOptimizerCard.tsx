"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type {
  Rebalancing,
  RebalancingSuggestion,
  SipAllocation,
  SipPlan,
} from "@/lib/types";

type SIPOptimizerCardProps = {
  rebalancing: Rebalancing;
  initialPlan?: SipPlan | null;
};

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

function buildSipPlan(
  rebalancing: Rebalancing,
  monthlyBudget: number
): SipPlan {
  const buySuggestions: RebalancingSuggestion[] = rebalancing.suggestions.filter(
    (s) => s.action === "buy"
  );

  if (!buySuggestions.length) {
    return {
      monthly_budget: monthlyBudget,
      allocations: [],
      message: "Your portfolio is well balanced. No SIP adjustments needed.",
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
        action_label: `Start ₹${monthlyAmount.toLocaleString("en-IN")}/month SIP`,
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
    message:
      `Invest ₹${totalMonthlySip.toLocaleString("en-IN")}/month across ${allocations.length} funds ` +
      "to reach ideal allocation",
  };
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function SIPOptimizerCard({
  rebalancing,
  initialPlan,
}: SIPOptimizerCardProps) {
  const [budget, setBudget] = useState<number>(initialPlan?.monthly_budget ?? 5000);

  const plan = useMemo(() => buildSipPlan(rebalancing, budget), [budget, rebalancing]);

  return (
    <section className="rounded-xl bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/[0.04] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#635bff]">
            <TrendingUp className="size-4" aria-hidden />
            SIP Optimizer
          </div>
          <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#0a2540]">
            Build a monthly plan
          </h3>
        </div>

        <label className="flex items-center gap-3 text-sm font-semibold text-[#425466]">
          Monthly budget
          <input
            className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm font-bold text-[#0a2540] outline-none transition focus:border-[#635bff]"
            inputMode="numeric"
            min={0}
            onChange={(event) => setBudget(Number(event.target.value.replace(/[^\d]/g, "")) || 0)}
            type="text"
            value={budget.toLocaleString("en-IN")}
          />
        </label>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#425466]">{plan.message}</p>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          className="mt-5 grid gap-3"
          key={budget}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          {plan.allocations.length ? (
            plan.allocations.map((allocation) => (
              <motion.article
                className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white via-[#f7f7ff] to-[#eef2ff] p-4"
                key={allocation.fund_isin}
                variants={itemVariants}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="text-base font-bold text-[#0a2540]">{allocation.fund_name}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100">
                        {allocation.fund_category}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {allocation.action_label}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#425466] ring-1 ring-slate-200">
                        Months to target: {allocation.months_to_target}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-left lg:text-right">
                    <div className="text-2xl font-bold tracking-[-0.03em] text-indigo-600">
                      ₹{allocation.monthly_amount.toLocaleString("en-IN")}
                    </div>
                    <div className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-[#697386]">
                      Monthly SIP
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-[#425466]">
                  Min SIP note: Minimum ₹{allocation.min_sip.toLocaleString("en-IN")} to start.
                </div>
              </motion.article>
            ))
          ) : (
            <motion.div
              className="rounded-xl border border-slate-200 bg-[#f6f9fc] p-4 text-sm text-[#425466]"
              variants={itemVariants}
            >
              No SIP allocations are needed right now.
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
