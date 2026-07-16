"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useSession } from "@/contexts/SessionContext";
import DashboardLayout from "@/components/DashboardLayout";
import HealthScoreCard from "@/components/HealthScoreCard";
import { ChartSkeleton, TableSkeleton } from "@/components/Skeleton";
import { Reveal, TiltCard } from "@/components/AppMotion";
import { ArrowUpRight, Layers3, ShieldCheck, Sparkles } from "lucide-react";

const NetWorthChart = dynamic(() => import("@/components/NetWorthChart"), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

const LedgerTable = dynamic(() => import("@/components/LedgerTable"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

export default function Dashboard() {
  const { session } = useSession();

  const totalNetWorth = useMemo(() => {
    if (!session) return 0
    return session.holdings.reduce(
      (sum, h) => sum + h.current_market_value,
      session.ledger_summary.closing_cash_balance
    )
  }, [session])

  const historicalData = useMemo(() => {
    if (!session || totalNetWorth === 0) return []
    
    // parse statement date
    const parts = session.metadata.statement_timestamp.split('-')
    const dateStr = parts.length === 3 
      ? `${parts[2]}-${parts[1]}-${parts[0]}`
      : session.metadata.statement_timestamp
    
    return [
      { date: dateStr, value: totalNetWorth }
    ]
  }, [session, totalNetWorth])

  const forecastData = useMemo(() => {
    if (!session || totalNetWorth === 0) return []
    
    const annualYield = totalNetWorth * 0.015
    const monthlyYield = annualYield / 12
    const months = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec'
    ]
    
    return months.map((month, i) => ({
      date: month,
      value: Math.round(monthlyYield * (i + 1))
    }))
  }, [session, totalNetWorth])

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout title="Overview">
      <div className="space-y-8 pb-12 [perspective:1200px]">
        <Reveal delay={0.02}>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-7 shadow-[0_20px_60px_rgba(99,91,255,0.1)] backdrop-blur-xl sm:p-9">
            <div className="absolute -right-12 -top-20 size-64 rounded-full bg-[#635bff]/10 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#635bff]/15 bg-[#635bff]/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#635bff]">
                  <Sparkles className="size-3.5" />
                  Portfolio command center
                </div>
                <h2 className="mt-5 max-w-2xl text-4xl leading-[0.95] tracking-[-0.04em] text-[#0a2540] sm:text-5xl">
                  A clearer view of your money.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#697386] sm:text-base">
                  Your latest statement is now a living snapshot—ready for decisions, explanations, and your next move.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { icon: Layers3, value: session.holdings.length, label: "positions" },
                  { icon: ShieldCheck, value: "Local", label: "processing" },
                  { icon: ArrowUpRight, value: session.health_score?.score ?? "—", label: "health score" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div className="min-w-[94px] rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm" key={item.label}>
                      <Icon className="size-4 text-[#635bff]" />
                      <p className="mt-2 text-xl font-bold text-[#0a2540]">{item.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94a3b8]">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>

        {/* SECTION 1 — Top row (2 columns):
            Left card (60% width): Net Worth Chart
            Right card (40% width): Portfolio Health Score (compact version) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <Reveal className="lg:col-span-3 scroll-mt-24" delay={0.05}>
            <TiltCard className="h-full">
              <NetWorthChart forecastData={forecastData} historicalData={historicalData} />
            </TiltCard>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.14}>
            {session.health_score && (
              <TiltCard>
                <HealthScoreCard healthScore={session.health_score} />
              </TiltCard>
            )}
          </Reveal>
        </div>

        {/* SECTION 2 — Bottom: Holdings Ledger (full width) */}
        <Reveal className="w-full" delay={0.22}>
          <TiltCard><LedgerTable assets={session.holdings} /></TiltCard>
        </Reveal>
      </div>
    </DashboardLayout>
  );
}
