"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import AIMemoCard from "@/components/AIMemoCard";
import LedgerTable from "@/components/LedgerTable";
import NetWorthChart from "@/components/NetWorthChart";
import UploadZone from "@/components/UploadZone";
import {
  PrivacyModeProvider,
  TopBarContent,
} from "@/components/TopBar";
import { analyzeSessions } from "@/lib/api";
import type { MasterParsedPayload } from "@/lib/types";
import { clearSession, loadSession } from "@/lib/storage";
import { cn } from "@/lib/utils";

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function GlassCard({
  area,
  children,
}: {
  area: "hero" | "memo" | "ledger";
  children: ReactNode;
}) {
  return (
    <motion.section
      className={cn(
        "min-h-[18rem] rounded-2xl border border-[#7c3aed]/20 bg-[#111118] p-6 shadow-[0_0_28px_rgba(124,58,237,0.12)]",
        area === "hero" && "[grid-area:hero]",
        area === "memo" && "[grid-area:memo]",
        area === "ledger" && "min-h-[20rem] [grid-area:ledger]"
      )}
      variants={cardVariants}
      whileHover={{
        scale: 1.02,
        borderColor: "rgba(124, 58, 237, 0.58)",
        boxShadow: "0 0 42px rgba(124, 58, 237, 0.26)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      {children}
    </motion.section>
  );
}

type ChartPoint = {
  date: string;
  value: number;
};

function formatHistoricalLabel(timestamp: string) {
  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return timestamp.slice(0, 10) || "Session";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildHistoricalData(session: MasterParsedPayload): ChartPoint[] {
  const totalValue =
    session.holdings.reduce(
      (sum, holding) => sum + holding.current_market_value,
      0
    ) + session.ledger_summary.closing_cash_balance;

  return [
    {
      date: formatHistoricalLabel(session.metadata.statement_timestamp),
      value: totalValue,
    },
  ];
}

export default function Home() {
  const [session, setSession] = useState<MasterParsedPayload | null>(() =>
    loadSession()
  );
  const [forecastData, setForecastData] = useState<ChartPoint[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const historicalData = useMemo(() => {
    if (!session) {
      return undefined;
    }

    return buildHistoricalData(session);
  }, [session]);

  useEffect(() => {
    if (session !== null) {
      return;
    }

    const storedSession = loadSession();

    if (storedSession) {
      setSession(storedSession);
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      setForecastData(null);
      setIsAnalyzing(false);
      return;
    }

    let cancelled = false;

    async function runAnalysis() {
      setIsAnalyzing(true);

      try {
        const response = await analyzeSessions([session]);

        if (cancelled) {
          return;
        }

        setForecastData(
          response.dividend_forecast.map((point) => ({
            date: point.date,
            value: point.projected_yield,
          }))
        );
      } catch {
        if (!cancelled) {
          setForecastData(null);
        }
      } finally {
        if (!cancelled) {
          setIsAnalyzing(false);
        }
      }
    }

    void runAnalysis();

    return () => {
      cancelled = true;
    };
  }, [session]);

  function handleClearSession() {
    clearSession();
    setSession(null);
    setForecastData(null);
    setIsAnalyzing(false);
  }

  const topBarActions = session ? (
    <motion.button
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-[#7c3aed]/45 hover:text-foreground",
        isAnalyzing && "cursor-wait opacity-70"
      )}
      initial={{ opacity: 0, y: -4 }}
      onClick={handleClearSession}
      type="button"
    >
      Clear Session
    </motion.button>
  ) : null;

  return (
    <PrivacyModeProvider>
      <TopBarContent actions={topBarActions} />
      <main className="min-h-screen bg-background px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <motion.div
          animate="visible"
          className="dashboard-grid mx-auto grid w-full max-w-7xl gap-4 lg:gap-6"
          initial="hidden"
          variants={gridVariants}
        >
          <GlassCard area="hero">
            <AnimatePresence mode="wait" initial={false}>
              {session ? (
                <motion.div
                  key="net-worth-chart"
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full"
                  exit={{ opacity: 0, y: 10 }}
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <NetWorthChart
                    forecastData={forecastData ?? undefined}
                    historicalData={historicalData}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="upload-zone"
                  animate={{ opacity: 1, y: 0 }}
                  className="flex h-full min-h-[24rem] items-center justify-center"
                  exit={{ opacity: 0, y: 10 }}
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <UploadZone onSuccess={setSession} />
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
          <GlassCard area="memo">
            <AIMemoCard
              holdings={session?.holdings ?? []}
              ledgerSummary={session?.ledger_summary ?? {
                closing_cash_balance: 0,
                cumulative_platform_fees: 0,
              }}
            />
          </GlassCard>
          <GlassCard area="ledger">
            <LedgerTable assets={session?.holdings} />
          </GlassCard>
        </motion.div>
      </main>
    </PrivacyModeProvider>
  );
}
