"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Download,
  Loader2,
  ArrowLeft,
  Calendar,
  Building,
} from "lucide-react";
import { ErrorCard } from "@/components/ErrorBoundary";
import { ChartSkeleton, MemoSkeleton, TableSkeleton } from "@/components/Skeleton";
import HealthScoreCard from "@/components/HealthScoreCard";
import RebalancingCard from "@/components/RebalancingCard";
import SIPOptimizerCard from "@/components/SIPOptimizerCard";
import UploadZone from "@/components/UploadZone";
import { analyzeSessions } from "@/lib/api";
import { exportPortfolioReport } from "@/lib/exportReport";
import type { MasterParsedPayload } from "@/lib/types";
import { clearSession, loadSession } from "@/lib/storage";

const NetWorthChart = dynamic(() => import("@/components/NetWorthChart"), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

const LedgerTable = dynamic(() => import("@/components/LedgerTable"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

const AIMemoCard = dynamic(() => import("@/components/AIMemoCard"), {
  loading: () => <MemoSkeleton />,
  ssr: false,
});

const smoothEase = [0.22, 1, 0.36, 1] as const;

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: smoothEase },
  },
};

type ChartPoint = {
  date: string;
  value: number;
};

const softCard =
  "rounded-xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/[0.04]";

export default function Dashboard() {
  const [session, setSession] = useState<MasterParsedPayload | null>(null);
  const [forecastData, setForecastData] = useState<ChartPoint[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const historicalData = useMemo(() => {
    if (!session) {
      return undefined;
    }

    const totalValue =
      session.holdings.reduce(
        (sum, holding) => sum + holding.current_market_value,
        0
      ) + session.ledger_summary.closing_cash_balance;

    const parsedDate = new Date(session.metadata.statement_timestamp);
    const dateLabel = !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : session.metadata.statement_timestamp.slice(0, 10) || "Session";

    return [{ date: dateLabel, value: totalValue }];
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
      setAnalysisError(null);
      return;
    }

    let cancelled = false;
    const activeSession = session;

    async function runAnalysis() {
      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const response = await analyzeSessions([activeSession]);

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
          setAnalysisError(
            "The analysis API could not be reached. Your uploaded session is still available locally."
          );
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
    setAnalysisError(null);
  }

  async function handleExportClick() {
    if (!session || isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      await exportPortfolioReport(session);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0a2540] font-sans pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#425466] transition hover:text-[#0a2540]"
            href="/"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Home</span>
          </Link>
          <div className="text-lg font-bold tracking-tight text-[#0a2540] md:text-xl">
            Rapidash Portfolio Dashboard
          </div>
          <div className="flex items-center gap-2">
            {session && (
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-[#635bff] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_12px_rgba(99,91,255,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(99,91,255,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isExporting}
                onClick={handleExportClick}
                type="button"
              >
                {isExporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                <span>Export PDF Report</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-[1280px] px-4 pt-6 sm:px-6 lg:px-8">
        {!session ? (
          /* Empty / Upload State */
          <motion.div
            animate="visible"
            className="mx-auto max-w-2xl py-12 text-center sm:py-16"
            initial="hidden"
            variants={sectionVariants}
          >
            <h1 className="text-3xl font-bold tracking-tight text-[#0a2540] sm:text-4xl">
              Upload Your Broker Statement
            </h1>
            <p className="mt-3 text-base text-[#425466] sm:text-lg">
              To view your interactive portfolio analysis, advisor notes, and net worth
              timeline, drop your NSE/BSE statement PDF below.
            </p>
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
              <UploadZone onSuccess={setSession} />
            </div>
            <div className="mt-6">
              <Link
                href="/"
                className="text-sm font-semibold text-[#635bff] hover:underline inline-flex items-center gap-1"
              >
                Learn how it works <ChevronRight className="size-4 inline" />
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Active Session Dashboard State */
          <div className="space-y-6">
            {/* Metadata Tags Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#425466]">
                <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium">
                  <Calendar className="size-4 text-[#635bff]" />
                  <span>Statement Date: {session.metadata.statement_timestamp}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium">
                  <Building className="size-4 text-[#635bff]" />
                  <span>Broker: {session.metadata.origin_broker}</span>
                </div>
              </div>
              <button
                className="text-xs font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 transition"
                onClick={handleClearSession}
                type="button"
              >
                Clear Session & Start Over
              </button>
            </div>

            {/* Two-Column Divided Layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Column: Historical Net Worth & Ledger */}
              <div className="lg:col-span-7 space-y-6">
                {/* Net Worth Chart Container */}
                <div id="net-worth-chart-container" className="scroll-mt-24">
                  <AnimatePresence mode="wait" initial={false}>
                    {isAnalyzing ? (
                      <motion.div
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        key="chart-skeleton"
                      >
                        <ChartSkeleton />
                      </motion.div>
                    ) : analysisError ? (
                      <ErrorCard message={analysisError} />
                    ) : (
                      <NetWorthChart
                        forecastData={forecastData ?? undefined}
                        historicalData={historicalData}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Ledger Table */}
                <div className="scroll-mt-24">
                  <div className={`${softCard} p-5 sm:p-6`}>
                    <div className="mb-4">
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#635bff]">
                        Holdings
                      </div>
                      <h3 className="text-lg font-bold text-[#0a2540] mt-1">
                        Asset Allocation Ledger
                      </h3>
                    </div>
                    <AnimatePresence mode="wait" initial={false}>
                      {isAnalyzing ? (
                        <motion.div
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          initial={{ opacity: 0 }}
                          key="table-skeleton"
                        >
                          <TableSkeleton />
                        </motion.div>
                      ) : (
                        <LedgerTable assets={session.holdings} />
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Right Column: Advisor notes, Chat, & Advisory Cards */}
              <div className="lg:col-span-5 space-y-6">
                {/* Advisor Notes and Chat */}
                <div className="scroll-mt-24">
                  <AnimatePresence mode="wait" initial={false}>
                    {isAnalyzing ? (
                      <motion.div
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        key="memo-skeleton"
                      >
                        <MemoSkeleton />
                      </motion.div>
                    ) : (
                      <AIMemoCard session={session} />
                    )}
                  </AnimatePresence>
                </div>

                {/* Health Score Breakdown */}
                {session.health_score ? (
                  <div className="scroll-mt-24">
                    <HealthScoreCard healthScore={session.health_score} />
                  </div>
                ) : null}

                {/* Smart Rebalancing Suggestions */}
                {session.rebalancing ? (
                  <div className="scroll-mt-24">
                    <RebalancingCard rebalancing={session.rebalancing} />
                  </div>
                ) : null}

                {/* SIP Recommendations */}
                {session.rebalancing && session.sip_plan ? (
                  <div className="scroll-mt-24">
                    <SIPOptimizerCard
                      initialPlan={session.sip_plan}
                      rebalancing={session.rebalancing}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
