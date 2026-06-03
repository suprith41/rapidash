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
  Download,
  Cpu,
  Shield,
  Loader2,
  MessageCircleMore,
} from "lucide-react";
import LandingNavigation from "@/components/LandingNavigation";
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

  function scrollToSection(sectionId: string) {
    if (sectionId === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleClearSession() {
    clearSession();
    setSession(null);
    setForecastData(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
  }

  function handleUploadClick() {
    scrollToSection("upload-section");
  }

  function handleHowItWorksClick() {
    scrollToSection("workflow");
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
    <>
      <LandingNavigation onUploadClick={handleUploadClick} onSectionClick={scrollToSection} />

      <main className="bg-white font-sans text-[#0a2540]">
        <section className="overflow-hidden bg-white px-6 pb-20 pt-32 sm:pt-40">
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
              dividend forecasts, and audit trails. Raidash gives you structured
              extraction with clear provenance for every field.
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
                See workflow <ChevronRight className="ml-1 inline size-4" />
              </button>
            </div>
            <div className="mt-16">
              <HeroMockup />
            </div>
          </motion.div>
        </section>

        <section className="bg-[#f6f9fc] px-6 py-24" id="about">
          <motion.div
            className="mx-auto max-w-[1280px]"
            initial="hidden"
            variants={sectionVariants}
            viewport={{ once: true, amount: 0.2 }}
            whileInView="visible"
          >
            <div className="max-w-3xl">
              <SectionLabel>About</SectionLabel>
              <h2 className="mt-5 text-4xl font-bold tracking-[-0.03em] text-[#0a2540] sm:text-5xl">
                A cleaner way to read a statement and act on it
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-[#425466]">
                Raidash turns a static broker PDF into a guided workflow: notes first,
                then Dash when you want a deeper read, then a dashboard that turns the
                numbers into action.
              </p>
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
                  title: "Private by design",
                  desc: "Your statement is parsed locally first, with the minimum necessary AI touchpoints.",
                },
                {
                  icon: Cpu,
                  title: "Dash notes",
                  desc: "Advisor-style memo paragraphs summarize risk, cash, and the next sensible move.",
                },
                {
                  icon: MessageCircleMore,
                  title: "Ask deeper questions",
                  desc: "Open Dash chat whenever you want a more specific explanation or action plan.",
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

        <section className="bg-white px-6 py-24" id="upload-section">
          <motion.div
            className="mx-auto max-w-[1280px]"
            initial="hidden"
            variants={sectionVariants}
            viewport={{ once: true, amount: 0.2 }}
            whileInView="visible"
          >
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <SectionLabel>Upload</SectionLabel>
                <h2 className="mt-5 text-4xl font-bold tracking-[-0.03em] text-[#0a2540] sm:text-5xl">
                  Upload a statement and get the workflow started
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-[#425466]">
                  Use this section as the first stop. Once the upload is done, the
                  dashboard unlocks the notes, chat, health checks, and allocation map.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    "PDFs parse into holdings, values, and timestamps.",
                    "Dash summarizes the position before you dig deeper.",
                    "Rebalancing and SIP guidance appear right after.",
                    "The dashboard remains easy to scan on mobile and desktop.",
                  ].map((item) => (
                    <div
                      className="rounded-xl border border-slate-200 bg-[#f6f9fc] p-4 text-sm leading-6 text-[#425466]"
                      key={item}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <UploadZone onSuccess={setSession} />
            </div>
          </motion.div>
        </section>

        <section className="bg-[#f6f9fc] px-6 py-24" id="portfolio-dashboard">
          <motion.div
            className="mx-auto max-w-[1280px]"
            initial="hidden"
            variants={sectionVariants}
            viewport={{ once: true, amount: 0.14 }}
            whileInView="visible"
          >
            <div className="mx-auto max-w-3xl text-center">
              <SectionLabel>Dashboard</SectionLabel>
              <h2 className="mt-5 text-4xl font-bold tracking-[-0.03em] text-[#0a2540] sm:text-5xl">
                Everything in one view
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#425466]">
                The dashboard keeps the big picture in view while Dash handles the
                conversation. Read the notes, ask deeper questions, and scan the
                allocation map without losing context.
              </p>
            </div>

            <div className="mt-14">
              {!session ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={`${softCard} mx-auto max-w-3xl p-4 sm:p-6`}
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="rounded-xl border border-dashed border-[#635bff]/30 bg-[#f6f9fc] p-6 text-center">
                    <p className="text-sm font-semibold text-[#0a2540]">
                      Upload a statement above to unlock the full dashboard.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#425466]">
                      The chart, Dash notes, health score, and allocation tools will appear
                      here once a file is processed.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
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

                    <div>
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
                  </div>

                  {session.health_score ? (
                    <div>
                      <HealthScoreCard healthScore={session.health_score} />
                    </div>
                  ) : null}

                  {session.rebalancing ? (
                    <div>
                      <RebalancingCard rebalancing={session.rebalancing} />
                    </div>
                  ) : null}

                  {session.rebalancing ? (
                    <div>
                      <SIPOptimizerCard
                        initialPlan={session.sip_plan}
                        rebalancing={session.rebalancing}
                      />
                    </div>
                  ) : null}

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

        <section className="bg-white px-6 py-24" id="workflow">
          <motion.div
            className="mx-auto max-w-[1280px]"
            initial="hidden"
            variants={sectionVariants}
            viewport={{ once: true, amount: 0.2 }}
            whileInView="visible"
          >
            <div className="mx-auto max-w-3xl text-center">
              <SectionLabel>Workflow</SectionLabel>
              <h2 className="mt-5 text-4xl font-bold tracking-[-0.03em] text-[#0a2540] sm:text-5xl">
                From upload to action in three steps
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
                  title: "Upload the statement",
                  desc: "Drop the PDF into the upload section and let the parser do the first pass.",
                },
                {
                  num: "2",
                  title: "Read the notes or open Dash",
                  desc: "Start with the memo, then ask Dash if you want the reasoning in more detail.",
                },
                {
                  num: "3",
                  title: "Review the allocation map",
                  desc: "Use health, rebalancing, and SIP guidance to decide what to change next.",
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

      {session ? (
        <motion.button
          aria-label="Export portfolio report"
          className="fixed bottom-6 right-6 z-[80] flex size-14 items-center justify-center rounded-full bg-[#635bff] text-white shadow-[0_14px_34px_rgba(99,91,255,0.32)]"
          onClick={handleExportClick}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          type="button"
        >
          {isExporting ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <Download className="size-5" aria-hidden />
          )}
        </motion.button>
      ) : null}
    </>
  );
}
