"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, PieChart, CheckCircle } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import DashboardLayout from "@/components/DashboardLayout";
import RebalancingCard from "@/components/RebalancingCard";

export default function InsightsPage() {
  const { session } = useSession();

  if (!session) return null;

  return (
    <DashboardLayout title="Insights">
      {/* 2 columns side by side (55% / 45% using a fractional grid layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-8 items-start pb-12">
        
        {/* LEFT COLUMN (55%): AI Investment Memo redesigned as short punchy cards */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Portfolio Signals
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              AI-driven risk assessment and key indicators
            </p>
          </div>

          <div className="space-y-4">
            {/* Card 1: Sector Concentration (Red border) */}
            <div className="bg-white rounded-2xl border-l-[3px] border-l-rose-500 border-y border-r border-slate-100 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow duration-200">
              <div>
                <div className="flex items-center gap-2 text-rose-500 mb-2">
                  <AlertTriangle className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Sector Concentration</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                  Single sector dominance detected
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                  70% of portfolio in one sector. Rebalance recommended.
                </p>
              </div>
              <div className="mt-4">
                <Link
                  href="/chat?q=Tell me more about sector concentration in my portfolio"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#635bff] bg-[#635bff]/5 hover:bg-[#635bff]/10 px-3 py-1 rounded-full transition-colors"
                >
                  View details →
                </Link>
              </div>
            </div>

            {/* Card 2: Diversification (Amber border) */}
            <div className="bg-white rounded-2xl border-l-[3px] border-l-amber-500 border-y border-r border-slate-100 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow duration-200">
              <div>
                <div className="flex items-center gap-2 text-amber-500 mb-2">
                  <PieChart className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Diversification</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                  Only 4 active holdings
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                  Minimum 8 holdings recommended for risk distribution.
                </p>
              </div>
              <div className="mt-4">
                <Link
                  href="/chat?q=How can I diversify my portfolio beyond the current active holdings?"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#635bff] bg-[#635bff]/5 hover:bg-[#635bff]/10 px-3 py-1 rounded-full transition-colors"
                >
                  View details →
                </Link>
              </div>
            </div>

            {/* Card 3: Cash Position (Green border) */}
            <div className="bg-white rounded-2xl border-l-[3px] border-l-emerald-500 border-y border-r border-slate-100 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow duration-200">
              <div>
                <div className="flex items-center gap-2 text-emerald-500 mb-2">
                  <CheckCircle className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Cash Position</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                  Cash utilization is optimal
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                  No idle cash drag detected in this statement.
                </p>
              </div>
              <div className="mt-4">
                <Link
                  href="/chat?q=What is the current cash utilization status and how is it optimized?"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#635bff] bg-[#635bff]/5 hover:bg-[#635bff]/10 px-3 py-1 rounded-full transition-colors"
                >
                  View details →
                </Link>
              </div>
            </div>
          </div>

          {/* Link button to chat below cards */}
          <div className="pt-2">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#635bff] hover:text-[#635bff]/85 transition-colors group"
            >
              Chat with Dash for deeper analysis
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN (45%): Smart Rebalancing card — full height */}
        <div className="h-full">
          {session.rebalancing && (
            <RebalancingCard rebalancing={session.rebalancing} />
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
