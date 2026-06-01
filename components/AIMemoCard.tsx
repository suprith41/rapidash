"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  CircleDollarSign,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type InvestmentAlert = {
  type: "risk" | "warning" | "opportunity";
  title: string;
  summary: string;
  detail: string;
};

type AIMemoCardProps = {
  alerts?: InvestmentAlert[];
};

const defaultAlerts: InvestmentAlert[] = [
  {
    type: "risk",
    title: "Sector Concentration Alert",
    summary: "Tech exposure at 47% — above safe threshold",
    detail:
      "Your portfolio is leaning heavily into technology. Consider trimming overweight positions or adding defensive sectors to reduce drawdown risk.",
  },
  {
    type: "warning",
    title: "Cash Drag Warning",
    summary: "Idle cash at 23% of portfolio — inflation eroding value",
    detail:
      "A large cash allocation can reduce volatility, but it may also dilute long-term returns. Review upcoming liquidity needs before redeploying.",
  },
  {
    type: "opportunity",
    title: "Dividend Opportunity",
    summary: "3 holdings due for dividend payout in next 30 days",
    detail:
      "Upcoming payouts could be reinvested into underweight income assets or used to rebalance without selling core holdings.",
  },
];

const severityStyles: Record<
  InvestmentAlert["type"],
  {
    border: string;
    icon: string;
    glow: string;
    Icon: LucideIcon;
  }
> = {
  risk: {
    border: "border-red-500/30 hover:border-red-500/55",
    icon: "bg-red-500/10 text-red-300 ring-red-500/25",
    glow: "shadow-[0_0_24px_rgba(239,68,68,0.10)]",
    Icon: ShieldAlert,
  },
  warning: {
    border: "border-amber-500/30 hover:border-amber-500/55",
    icon: "bg-amber-500/10 text-amber-300 ring-amber-500/25",
    glow: "shadow-[0_0_24px_rgba(245,158,11,0.10)]",
    Icon: AlertTriangle,
  },
  opportunity: {
    border: "border-emerald-500/30 hover:border-emerald-500/55",
    icon: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25",
    glow: "shadow-[0_0_24px_rgba(16,185,129,0.10)]",
    Icon: CircleDollarSign,
  },
};

function MemoAlertBlock({
  alert,
  defaultOpen = false,
}: {
  alert: InvestmentAlert;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const styles = severityStyles[alert.type];
  const Icon = styles.Icon;

  return (
    <motion.div
      className={cn(
        "overflow-hidden rounded-xl border bg-white/[0.025] transition-colors",
        styles.border,
        styles.glow
      )}
      layout
    >
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 p-3 text-left"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full ring-1",
            styles.icon
          )}
        >
          <Icon aria-hidden className="size-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {alert.title}
          </span>
          <AnimatePresence initial={false}>
            {isOpen ? (
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 block text-xs leading-5 text-muted"
                exit={{ opacity: 0, y: -4 }}
                initial={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                {alert.summary}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-muted"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <ChevronDown aria-hidden className="size-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="border-t border-white/5 px-3 pb-4 pt-3 text-sm leading-6 text-slate-300">
              {alert.detail}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AIMemoCard({ alerts = defaultAlerts }: AIMemoCardProps) {
  const memoAlerts = alerts.length > 0 ? alerts : defaultAlerts;

  return (
    <section className="flex h-full min-h-[18rem] flex-col">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            AI Investment Memo
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Portfolio Signals
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
          <span className="size-2 rounded-full bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite]" />
          Live
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-3">
        {memoAlerts.map((alert, index) => (
          <MemoAlertBlock
            alert={alert}
            defaultOpen={index === 0}
            key={`${alert.type}-${alert.title}`}
          />
        ))}
      </div>
    </section>
  );
}
