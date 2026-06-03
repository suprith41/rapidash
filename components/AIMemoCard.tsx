"use client";

import { memo, useMemo, useState } from "react";
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
  investmentMemo?: string | null;
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
    border: "border-red-200 hover:border-red-300",
    icon: "bg-red-50 text-red-600 ring-red-200",
    glow: "shadow-none",
    Icon: ShieldAlert,
  },
  warning: {
    border: "border-amber-200 hover:border-amber-300",
    icon: "bg-amber-50 text-amber-600 ring-amber-200",
    glow: "shadow-none",
    Icon: AlertTriangle,
  },
  opportunity: {
    border: "border-emerald-200 hover:border-emerald-300",
    icon: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    glow: "shadow-none",
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
        "overflow-hidden rounded-xl border bg-white transition-colors",
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
          <span className="block truncate text-sm font-semibold text-[#0a2540]">
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
            <div className="border-t border-slate-100 px-3 pb-4 pt-3 text-sm leading-6 text-[#425466]">
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
      className="flex flex-1 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      <div>
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CircleDollarSign aria-hidden className="size-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-emerald-700">
          Portfolio looks healthy
        </p>
        <p className="mt-1 text-xs leading-5 text-emerald-700/80">
          No major concentration, cash drag, or verification issues were detected.
        </p>
      </div>
    </motion.div>
  );
}

function AIMemoCard({
  holdings,
  ledgerSummary,
  investmentMemo,
}: AIMemoCardProps) {
  const memoAlerts = useMemo(
    () => buildDynamicAlerts(holdings, ledgerSummary),
    [holdings, ledgerSummary]
  );
  const hasAlerts = memoAlerts.length > 0;
  const memoParagraphs = useMemo(
    () =>
      investmentMemo
        ? investmentMemo
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
        : [],
    [investmentMemo]
  );
  const hasMemo = memoParagraphs.length > 0;

  return (
    <section className="flex h-full min-h-[18rem] flex-col">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#635bff]">
            AI Investment Memo
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-[#0a2540]">
            Advisor Notes
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          <span className="size-2 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]" />
          Live
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-4">
        {hasMemo ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[#e8ebff] bg-[#f7f8ff] p-4 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#635bff]">
              Portfolio Memo
            </p>
            <div className="mt-3 space-y-3 text-sm leading-7 text-[#425466]">
              {memoParagraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
              ))}
            </div>
          </motion.div>
        ) : null}

        {hasAlerts ? (
          <div className="flex flex-col gap-3">
            {memoAlerts.map((alert, index) => (
              <MemoAlertBlock
                alert={alert}
                defaultOpen={index === 0 && !hasMemo}
                key={`${alert.type}-${alert.title}`}
              />
            ))}
          </div>
        ) : (
          <HealthyState />
        )}
      </div>
    </section>
  );
}

export default memo(AIMemoCard);
