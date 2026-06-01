"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronRight,
  Cpu,
  GitBranch,
  Shield,
} from "lucide-react";
import LandingNavigation from "@/components/LandingNavigation";
import { ErrorCard } from "@/components/ErrorBoundary";
import { ChartSkeleton, MemoSkeleton, TableSkeleton } from "@/components/Skeleton";
import UploadZone from "@/components/UploadZone";
import { PrivacyModeProvider } from "@/components/TopBar";
import { analyzeSessions } from "@/lib/api";
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

const staggerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: smoothEase },
  },
};

type ChartPoint = {
  date: string;
  value: number;
};

const softCard =
  "rounded-xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/[0.04]";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#635bff]">
      {children}
    </p>
  );
}

function HeroMockup() {
  const mockData: ChartPoint[] = [
    { date: "Jan", value: 850000 },
    { date: "Feb", value: 920000 },
    { date: "Mar", value: 1050000 },
    { date: "Apr", value: 1180000 },
    { date: "May", value: 1320000 },
    { date: "Jun", value: 1510000 },
  ];

  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      className={`${softCard} mx-auto w-full max-w-4xl p-4 sm:p-6`}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#635bff]">
            Net Worth
          </p>
          <div className="mt-2 text-3xl font-bold tracking-tight text-[#0a2540]">
            ₹15.1L
          </div>
        </div>
        <div className="inline-flex w-fit rounded-full bg-[#f6f9fc] p-1 text-xs font-semibold text-[#425466]">
          <span className="rounded-full bg-white px-3 py-1.5 text-[#635bff] shadow-sm">
            Timeline
          </span>
          <span className="px-3 py-1.5">Forecast</span>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer height="100%" minWidth={0} width="100%">
          <AreaChart data={mockData} margin={{ bottom: 0, left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="heroMockupGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#635bff" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#635bff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e6ebf1" strokeDasharray="3 3" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              tick={{ fill: "#697386", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "#697386", fontSize: 12 }}
              tickFormatter={(value) => `₹${Number(value) / 100000}L`}
              tickLine={false}
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e6ebf1",
                borderRadius: 12,
                boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
                color: "#0a2540",
              }}
              formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Value"]}
            />
            <Area
              dataKey="value"
              fill="url(#heroMockupGradient)"
              stroke="#635bff"
              strokeLinecap="round"
              strokeWidth={3}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [session, setSession] = useState<MasterParsedPayload | null>(() =>
    loadSession()
  );
  const [forecastData, setForecastData] = useState<ChartPoint[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showUploadZone, setShowUploadZone] = useState(false);

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
    setShowUploadZone(false);
  }

  function handleUploadClick() {
    if (session) {
      setShowUploadZone(!showUploadZone);
    } else {
      document.getElementById("upload-zone")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  function handleHowItWorksClick() {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <PrivacyModeProvider>
      <LandingNavigation onUploadClick={handleUploadClick} />

      <main className="bg-white font-sans text-[#0a2540]">
        <section className="overflow-hidden bg-white px-6 pb-24 pt-32 sm:pt-40">
          <motion.div
            animate="visible"
            className="mx-auto max-w-[1280px] text-center"
            initial="hidden"
            variants={sectionVariants}
          >
            <SectionLabel>Privacy-first wealth tracking</SectionLabel>
            <h1 className="mx-auto mt-6 max-w-5xl text-5xl font-bold leading-[1.02] tracking-[-0.04em] text-[#0a2540] sm:text-[64px]">
              Your entire financial picture. No middleman.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#425466] sm:text-xl">
              Upload your broker statement once and get instant portfolio insights,
              dividend forecasts, and audit trails. Raidash parses privately so your
              financial life stays on your machine.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <button
                className="rounded-lg bg-[#635bff] px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(99,91,255,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(99,91,255,0.28)]"
                onClick={handleUploadClick}
                type="button"
              >
                Upload Your Statement
              </button>
              <button
                className="rounded-lg border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-[#0a2540] transition hover:-translate-y-0.5 hover:border-[#635bff]/40 hover:text-[#635bff]"
                onClick={handleHowItWorksClick}
                type="button"
              >
                See how it works <ChevronRight className="ml-1 inline size-4" />
              </button>
            </div>
            <div className="mt-16">
              <HeroMockup />
            </div>
          </motion.div>
        </section>

        <section className="bg-[#f6f9fc] px-6 py-24">
          <motion.div
            className="mx-auto max-w-[1280px]"
            initial="hidden"
            variants={sectionVariants}
            viewport={{ once: true, amount: 0.2 }}
            whileInView="visible"
          >
            <div className="max-w-3xl">
              <SectionLabel>Built different</SectionLabel>
              <h2 className="mt-5 text-4xl font-bold tracking-[-0.03em] text-[#0a2540] sm:text-5xl">
                Institutional-grade tools for retail investors
              </h2>
            </div>

            <motion.div
              className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3"
              initial="hidden"
              variants={staggerVariants}
              viewport={{ once: true, amount: 0.2 }}
              whileInView="visible"
            >
              {[
                {
                  icon: Shield,
                  title: "Zero-trust privacy",
                  desc: "PII scrubbed before any LLM sees it.",
                },
                {
                  icon: Cpu,
                  title: "Local-first AI",
                  desc: "Runs on your machine via Ollama.",
                },
                {
                  icon: GitBranch,
                  title: "Audit everything",
                  desc: "Every data point traced to source PDF page.",
                },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.article
                    className={`${softCard} p-8`}
                    key={feature.title}
                    variants={itemVariants}
                  >
                    <div className="flex size-12 items-center justify-center rounded-lg bg-[#635bff]/10 text-[#635bff]">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold tracking-[-0.02em] text-[#0a2540]">
                      {feature.title}
                    </h3>
                    <p className="mt-3 leading-7 text-[#425466]">{feature.desc}</p>
                  </motion.article>
                );
              })}
            </motion.div>
          </motion.div>
        </section>

        <section className="bg-white px-6 py-24">
          <motion.div
            className="mx-auto max-w-[1280px]"
            initial="hidden"
            variants={sectionVariants}
            viewport={{ once: true, amount: 0.14 }}
            whileInView="visible"
          >
            <div className="mx-auto max-w-3xl text-center">
              <SectionLabel>Your dashboard</SectionLabel>
              <h2 className="mt-5 text-4xl font-bold tracking-[-0.03em] text-[#0a2540] sm:text-5xl">
                Everything in one view
              </h2>
            </div>

            <div className="mt-14" id="upload-zone">
              {!session ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={`${softCard} mx-auto max-w-3xl p-4 sm:p-6`}
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.6 }}
                >
                  <UploadZone onSuccess={setSession} />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.6 }}
                >
                  {showUploadZone ? (
                    <div className={`${softCard} p-4 sm:p-6`}>
                      <UploadZone onSuccess={setSession} />
                    </div>
                  ) : null}

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className={`${softCard} p-5 sm:p-6`}>
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

                    <div className={`${softCard} p-5 sm:p-6`}>
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
                          <AIMemoCard
                            holdings={session.holdings}
                            ledgerSummary={session.ledger_summary}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className={`${softCard} p-5 sm:p-6`}>
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

                  <div className="flex justify-center pt-2">
                    <button
                      className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-[#0a2540] transition hover:border-[#635bff]/40 hover:text-[#635bff]"
                      onClick={handleClearSession}
                      type="button"
                    >
                      Clear Session & Start Over
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </section>

        <section className="bg-[#f6f9fc] px-6 py-24" id="how-it-works">
          <motion.div
            className="mx-auto max-w-[1280px]"
            initial="hidden"
            variants={sectionVariants}
            viewport={{ once: true, amount: 0.2 }}
            whileInView="visible"
          >
            <div className="mx-auto max-w-3xl text-center">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="mt-5 text-4xl font-bold tracking-[-0.03em] text-[#0a2540] sm:text-5xl">
                Three simple steps
              </h2>
            </div>

            <motion.div
              className="mt-14 grid gap-6 md:grid-cols-3"
              initial="hidden"
              variants={staggerVariants}
              viewport={{ once: true, amount: 0.2 }}
              whileInView="visible"
            >
              {[
                {
                  num: "1",
                  title: "Drop your broker statement",
                  desc: "Zerodha, Groww, Upstox supported.",
                },
                {
                  num: "2",
                  title: "AI parses and verifies",
                  desc: "Deterministic first, LLM fallback, NSE validated.",
                },
                {
                  num: "3",
                  title: "Your dashboard updates",
                  desc: "Timeline, forecasts, alerts, all private.",
                },
              ].map((step) => (
                <motion.article className={`${softCard} p-8`} key={step.num} variants={itemVariants}>
                  <div className="flex size-11 items-center justify-center rounded-full bg-[#635bff] text-lg font-bold text-white shadow-[0_8px_18px_rgba(99,91,255,0.24)]">
                    {step.num}
                  </div>
                  <h3 className="mt-6 text-xl font-bold tracking-[-0.02em] text-[#0a2540]">
                    {step.title}
                  </h3>
                  <p className="mt-3 leading-7 text-[#425466]">{step.desc}</p>
                </motion.article>
              ))}
            </motion.div>
          </motion.div>
        </section>

        <footer className="border-t border-slate-200 bg-white px-6 py-10">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-col gap-8 border-b border-slate-100 pb-8 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xl font-bold tracking-[-0.03em] text-[#0a2540]">
                  Raidash
                </div>
                <p className="mt-2 text-sm text-[#425466]">
                  Built for privacy-conscious Indian investors
                </p>
              </div>
              <p className="text-sm font-bold text-[#0a2540]">
                0 servers store your data. Ever.
              </p>
            </div>
            <p className="pt-8 text-sm text-[#697386]">
              © {new Date().getFullYear()} Raidash. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </PrivacyModeProvider>
  );
}
