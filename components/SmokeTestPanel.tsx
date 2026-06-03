"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronUp, Circle, XCircle } from "lucide-react";
import { loadSession } from "@/lib/storage";
import type { MasterParsedPayload } from "@/lib/types";

type CheckStatus = "pending" | "pass" | "fail";

type SmokeTestResult = {
  id:
    | "storage"
    | "apiUrl"
    | "backend"
    | "sessionShape";
  label: string;
  status: CheckStatus;
  detail: string;
};

type StateMap = Record<SmokeTestResult["id"], SmokeTestResult>;

const defaultChecks: StateMap = {
  storage: {
    id: "storage",
    label: "localStorage read/write working",
    status: "pending",
    detail: "Pending",
  },
  apiUrl: {
    id: "apiUrl",
    label: "NEXT_PUBLIC_API_URL is set",
    status: "pending",
    detail: "Pending",
  },
  backend: {
    id: "backend",
    label: "GET http://localhost:8000/ returns status online",
    status: "pending",
    detail: "Pending",
  },
  sessionShape: {
    id: "sessionShape",
    label: "Session data in localStorage is valid MasterParsedPayload shape",
    status: "pending",
    detail: "Pending",
  },
};

function isMasterParsedPayloadShape(value: unknown): value is MasterParsedPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const metadata = record.metadata as Record<string, unknown> | undefined;
  const holdings = record.holdings as unknown[] | undefined;
  const ledgerSummary = record.ledger_summary as Record<string, unknown> | undefined;

  const isHoldingShape = (holding: unknown) => {
    if (!holding || typeof holding !== "object" || Array.isArray(holding)) {
      return false;
    }

    const item = holding as Record<string, unknown>;

    return (
      typeof item.ticker_symbol === "string" &&
      typeof item.isin === "string" &&
      typeof item.quantity === "number" &&
      typeof item.average_buy_price === "number" &&
      typeof item.current_market_value === "number" &&
      typeof item.source_page === "number" &&
      (item.extraction_method === "deterministic" || item.extraction_method === "llm") &&
      (item.confidence === "high" || item.confidence === "low") &&
      typeof item.exit_confirmed === "boolean"
    );
  };

  return (
    !!metadata &&
    typeof metadata.statement_timestamp === "string" &&
    typeof metadata.origin_broker === "string" &&
    Array.isArray(holdings) &&
    holdings.every(isHoldingShape) &&
    !!ledgerSummary &&
    typeof ledgerSummary.closing_cash_balance === "number" &&
    typeof ledgerSummary.cumulative_platform_fees === "number"
  );
}

function StatusDot({ status }: { status: CheckStatus }) {
  if (status === "pass") {
    return <CheckCircle2 aria-hidden className="size-4 text-emerald-400" />;
  }

  if (status === "fail") {
    return <XCircle aria-hidden className="size-4 text-red-400" />;
  }

  return <Circle aria-hidden className="size-4 text-muted" />;
}

export default function SmokeTestPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [checks, setChecks] = useState<StateMap>(defaultChecks);

  const allComplete = useMemo(
    () => Object.values(checks).every((check) => check.status !== "pending"),
    [checks]
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    let cancelled = false;

    async function runChecks() {
      const nextChecks: StateMap = {
        ...defaultChecks,
      };

      try {
        const storageKey = "raidash_smoke_storage";
        window.localStorage.setItem(storageKey, "ok");
        const value = window.localStorage.getItem(storageKey);
        window.localStorage.removeItem(storageKey);

        nextChecks.storage = {
          ...nextChecks.storage,
          status: value === "ok" ? "pass" : "fail",
          detail:
            value === "ok"
              ? "Write and read operations completed successfully."
              : "localStorage round-trip failed.",
        };
      } catch {
        nextChecks.storage = {
          ...nextChecks.storage,
          status: "fail",
          detail: "localStorage is not available in this environment.",
        };
      }

      nextChecks.apiUrl = {
        ...nextChecks.apiUrl,
        status: process.env.NEXT_PUBLIC_API_URL ? "pass" : "fail",
        detail: process.env.NEXT_PUBLIC_API_URL
          ? process.env.NEXT_PUBLIC_API_URL
          : "NEXT_PUBLIC_API_URL is missing.",
      };

      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 2500);

        const response = await fetch("http://localhost:8000/", {
          signal: controller.signal,
        });
        window.clearTimeout(timeout);

        const body: unknown = await response.json().catch(() => null);
        const statusValue =
          body && typeof body === "object" && !Array.isArray(body)
            ? (body as Record<string, unknown>).status
            : null;
        const statusText = typeof statusValue === "string" ? statusValue : "";

        const passed = response.ok && statusText.toLowerCase().includes("online");

        nextChecks.backend = {
          ...nextChecks.backend,
          status: passed ? "pass" : "fail",
          detail: passed
            ? statusText || "Backend is online."
            : `Unexpected response: ${response.status}`,
        };
      } catch (error) {
        nextChecks.backend = {
          ...nextChecks.backend,
          status: "fail",
          detail:
            error instanceof Error ? error.message : "Backend health check failed.",
        };
      }

      try {
        const session = loadSession();
        nextChecks.sessionShape = {
          ...nextChecks.sessionShape,
          status: session && isMasterParsedPayloadShape(session) ? "pass" : "fail",
          detail:
            session && isMasterParsedPayloadShape(session)
              ? "Stored session matches the expected payload shape."
              : "No valid session payload was found in localStorage.",
        };
      } catch {
        nextChecks.sessionShape = {
          ...nextChecks.sessionShape,
          status: "fail",
          detail: "Session validation failed.",
        };
      }

      if (!cancelled) {
        setChecks(nextChecks);
      }
    }

    void runChecks();

    return () => {
      cancelled = true;
    };
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[80] max-w-sm">
      <motion.div
        animate={{ y: 0, opacity: 1 }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f]/88 shadow-[0_0_24px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        initial={{ y: 8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >
        <button
          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Dev Smoke Tests
            </p>
            <p className="mt-1 text-sm text-foreground">
              {allComplete ? "Checks complete" : "Running checks"}
            </p>
          </div>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
          >
            <ChevronUp aria-hidden className="size-4 text-muted" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              animate={{ height: "auto", opacity: 1 }}
              className="border-t border-white/5 px-3 py-3"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="space-y-2 text-sm">
                {Object.values(checks).map((check) => (
                  <div
                    className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
                    key={check.id}
                  >
                    <div className="mt-0.5 shrink-0">
                      <StatusDot status={check.status} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">{check.label}</p>
                      <p className="mt-1 text-[11px] leading-5 text-muted">{check.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
