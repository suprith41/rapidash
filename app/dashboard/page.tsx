"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useSession } from "@/contexts/SessionContext";
import DashboardLayout from "@/components/DashboardLayout";
import HealthScoreCard from "@/components/HealthScoreCard";
import { ChartSkeleton, TableSkeleton } from "@/components/Skeleton";
import { Reveal, TiltCard } from "@/components/AppMotion";

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
