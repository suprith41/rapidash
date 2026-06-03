"use client";

import { memo, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  CircleDollarSign,
  Send,
  ShieldAlert,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type {
  AssetHolding,
  CashLedgerSummary,
  DashChatMessage,
  MasterParsedPayload,
} from "@/lib/types";
import { chatWithDash } from "@/lib/api";
import { cn } from "@/lib/utils";

export type InvestmentAlert = {
  type: "risk" | "warning" | "opportunity";
  title: string;
  summary: string;
  detail: string;
};

type AIMemoCardProps = {
  session: MasterParsedPayload;
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

function AIMemoCard({ session }: AIMemoCardProps) {
  const { holdings, ledger_summary: ledgerSummary, investment_memo: investmentMemo } = session;
  const memoAlerts = useMemo(
    () => buildDynamicAlerts(holdings, ledgerSummary),
    [holdings, ledgerSummary]
  );
  const hasAlerts = memoAlerts.length > 0;
  const [mode, setMode] = useState<"notes" | "chat">("notes");
  const [chatMessages, setChatMessages] = useState<DashChatMessage[]>([
    {
      role: "assistant",
      content:
        investmentMemo ||
        "I’m Dash. I can walk you through concentration, rebalancing, and what to do next.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
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

  async function sendDashMessage(prompt?: string) {
    const content = (prompt ?? draft).trim();
    if (!content || isSending) {
      return;
    }

    const nextMessages: DashChatMessage[] = [...chatMessages, { role: "user", content }];
    setChatMessages(nextMessages);
    setDraft("");
    setIsSending(true);
    setMode("chat");

    try {
      const response = await chatWithDash(session, nextMessages);
      setChatMessages((current) => [
        ...current,
        { role: "assistant", content: response.assistant_message },
      ]);
    } catch {
      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I couldn’t reach Dash just now. Try again in a moment, and I’ll pick up the portfolio review from here.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section
      className="flex h-full min-h-[18rem] flex-col rounded-2xl bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/[0.04] sm:p-6"
      id="dash"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#635bff]">
            <Sparkles className="size-4" aria-hidden />
            Dash
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-[#0a2540]">
            Advisor notes and chat
          </h2>
        </div>
        <button
          className="rounded-full border border-[#d7ddff] bg-[#f7f8ff] px-3 py-1.5 text-xs font-bold text-[#635bff] transition hover:border-[#635bff]/35 hover:bg-[#eef0ff]"
          onClick={() => setMode((current) => (current === "notes" ? "chat" : "notes"))}
          type="button"
        >
          {mode === "notes" ? "Dive in deeper" : "Back to notes"}
        </button>
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
              AI Notes
            </p>
            <div className="mt-3 space-y-3 text-sm leading-7 text-[#425466]">
              {memoParagraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="rounded-full bg-[#635bff] px-3 py-1.5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(99,91,255,0.18)] transition hover:-translate-y-0.5"
                onClick={() => setMode("chat")}
                type="button"
              >
                Chat with Dash
              </button>
              <button
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0a2540] transition hover:border-[#635bff]/35 hover:text-[#635bff]"
                onClick={() => sendDashMessage("Can you dive deeper into the portfolio and explain the biggest risks and next actions?")}
                type="button"
              >
                Dive in deeper
              </button>
            </div>
          </motion.div>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          {mode === "chat" ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-xl border border-[#dfe6ff] bg-white shadow-[0_10px_28px_rgba(10,37,64,0.05)]"
              exit={{ opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 8 }}
              key="dash-chat"
              transition={{ duration: 0.22 }}
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#635bff]">
                  Chat with Dash
                </p>
                <p className="mt-1 text-sm text-[#425466]">
                  Ask for a deeper read on concentration, cash, rebalancing, or SIPs.
                </p>
              </div>

              <div className="max-h-[18rem] space-y-3 overflow-y-auto px-4 py-4">
                {chatMessages.map((message, index) => (
                  <div
                    className={cn(
                      "flex",
                      message.role === "assistant" ? "justify-start" : "justify-end"
                    )}
                    key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                  >
                    <div
                      className={cn(
                        "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6",
                        message.role === "assistant"
                          ? "bg-[#f7f8ff] text-[#0a2540]"
                          : "bg-[#635bff] text-white"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 p-4">
                <div className="flex flex-wrap gap-2 pb-3">
                  {[
                    "Dive deeper on concentration",
                    "Should I rebalance now?",
                    "What should I do with SIPs?",
                  ].map((prompt) => (
                    <button
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#425466] transition hover:border-[#635bff]/35 hover:text-[#635bff]"
                      key={prompt}
                      onClick={() => void sendDashMessage(prompt)}
                      type="button"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0a2540] outline-none transition placeholder:text-[#94a3b8] focus:border-[#635bff]"
                    placeholder="Ask Dash anything about this portfolio..."
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendDashMessage();
                      }
                    }}
                  />
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-[#635bff] px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSending}
                    onClick={() => void sendDashMessage()}
                    type="button"
                  >
                    <Send className="size-4" aria-hidden />
                    {isSending ? "Thinking..." : "Send"}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

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
