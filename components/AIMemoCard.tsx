"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  CircleDollarSign,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { AssetHolding, CashLedgerSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export type InvestmentAlert = {
  type: "risk" | "warning" | "opportunity";
  title: string;
  summary: string;
  detail: string;
};

type AIMemoCardProps = {
  holdings: AssetHolding[];
  ledgerSummary: CashLedgerSummary;
};

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

function buildDynamicAlerts(
  holdings: AssetHolding[],
  ledgerSummary: CashLedgerSummary
): InvestmentAlert[] {
  const alerts: InvestmentAlert[] = [];
  const totalHoldingsValue = holdings.reduce(
    (sum, holding) => sum + holding.current_market_value,
    0
  );
  const portfolioTotal = totalHoldingsValue + ledgerSummary.closing_cash_balance;

  if (portfolioTotal > 0) {
    const groupedValueByInitial = holdings.reduce<Record<string, number>>(
      (groups, holding) => {
        const groupKey = holding.ticker_symbol.trim().charAt(0).toUpperCase() || "#";
        groups[groupKey] = (groups[groupKey] ?? 0) + holding.current_market_value;
        return groups;
      },
      {}
    );

    const maxGroupShare = Object.values(groupedValueByInitial).reduce(
      (maxShare, groupValue) => Math.max(maxShare, groupValue / portfolioTotal),
      0
    );

    if (maxGroupShare > 0.4) {
      alerts.push({
        type: "risk",
        title: "Sector Concentration Alert",
        summary: "Sector concentration detected — review diversification",
        detail:
          "One ticker initial group now represents more than 40% of total portfolio value. This proxy concentration signal suggests you should review diversification across holdings.",
      });
    }

    const idleCashRatio = ledgerSummary.closing_cash_balance / portfolioTotal;

    if (idleCashRatio > 0.2) {
      alerts.push({
        type: "warning",
        title: "Cash Drag Warning",
        summary: `Idle cash at ${(idleCashRatio * 100).toFixed(1)}% of portfolio — purchasing power eroding`,
        detail:
          "Cash is taking up a large share of total portfolio value. Consider whether these reserves are intentional or whether capital should be redeployed.",
      });
    }
  }

  const lowConfidenceCount = holdings.filter(
    (holding) => holding.confidence === "low"
  ).length;

  if (lowConfidenceCount > 0) {
    alerts.push({
      type: "warning",
      title: "Audit Trail Review",
      summary: `${lowConfidenceCount} holdings could not be verified against NSE master data — review audit trail`,
      detail:
        "At least one holding has low confidence. Review the extracted position against the statement audit trail before acting on the data.",
    });
  }

  return alerts;
}

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

function HealthyState() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-6 text-center"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      <div>
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <CircleDollarSign aria-hidden className="size-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-emerald-200">
          Portfolio looks healthy
        </p>
        <p className="mt-1 text-xs leading-5 text-emerald-100/80">
          No major concentration, cash drag, or verification issues were detected.
        </p>
      </div>
    </motion.div>
  );
}

export default function AIMemoCard({ holdings, ledgerSummary }: AIMemoCardProps) {
  const memoAlerts = useMemo(
    () => buildDynamicAlerts(holdings, ledgerSummary),
    [holdings, ledgerSummary]
  );
  const hasAlerts = memoAlerts.length > 0;

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
        {hasAlerts ? (
          memoAlerts.map((alert, index) => (
            <MemoAlertBlock
              alert={alert}
              defaultOpen={index === 0}
              key={`${alert.type}-${alert.title}`}
            />
          ))
        ) : (
          <HealthyState />
        )}
      </div>
    </section>
  );
}
