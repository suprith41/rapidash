"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Scale, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Tab 1: Portfolio Health Card ---
function PortfolioHealthCard({ activeTab }: { activeTab: number }) {
  const circleRadius = 60;
  const circumference = 2 * Math.PI * circleRadius; // ~377

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-8 shadow-[0_4px_32px_rgba(99,91,255,0.06)] ring-1 ring-[#635bff]/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left column: circular score */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex items-center justify-center w-[150px] h-[150px]">
            {/* SVG circle arc */}
            <svg width="150" height="150" viewBox="0 0 150 150" className="-rotate-90">
              <circle
                cx="75"
                cy="75"
                r={circleRadius}
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="10"
              />
              <motion.circle
                cx="75"
                cy="75"
                r={circleRadius}
                fill="transparent"
                stroke="#635bff"
                strokeWidth="10"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{
                  strokeDashoffset: activeTab === 0 ? circumference * (1 - 0.74) : circumference,
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-4xl font-extrabold text-slate-800">74</div>
          </div>
          <span className="mt-5 text-lg font-bold text-slate-700 tracking-tight">Grade B — Good</span>
        </div>

        {/* Right column: 4 progress bars */}
        <div className="space-y-5">
          {[
            { label: "Diversification", current: 24, max: 30 },
            { label: "Cash Utilization", current: 25, max: 25 },
            { label: "Sector Balance", current: 15, max: 25 },
            { label: "Portfolio Quality", current: 20, max: 20 },
          ].map((bar, idx) => {
            const pct = (bar.current / bar.max) * 100;
            return (
              <div key={bar.label} className="space-y-2">
                <div className="flex justify-between text-sm font-semibold text-slate-600">
                  <span>{bar.label}</span>
                  <span>{bar.current}/{bar.max}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#635bff] rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: activeTab === 0 ? `${pct}%` : "0%" }}
                    transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Tab 2: Rebalancing Card ---
function RebalancingCard({ activeTab }: { activeTab: number }) {
  const rows = [
    {
      label: "Large Cap Equity",
      pct: 60,
      current: "₹42,000",
      action: "Sell",
      actionVal: "₹8,000",
    },
    {
      label: "Mid Cap Equity",
      pct: 25,
      current: "₹12,000",
      action: "Buy",
      actionVal: "₹6,000",
    },
    {
      label: "Mutual Funds",
      pct: 38,
      current: "₹18,000",
      action: "Buy",
      actionVal: "₹4,000",
    },
    {
      label: "Cash Reserve",
      pct: 12,
      current: "₹5,000",
      action: "Hold",
      actionVal: "",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-8 shadow-[0_4px_32px_rgba(99,91,255,0.04)]">
      <div className="flex items-center space-x-3 mb-6 border-b border-slate-50 pb-4">
        <div className="p-2 bg-[#635bff]/10 text-[#635bff] rounded-lg">
          <Scale className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-bold text-slate-800">Smart Rebalancing</h4>
      </div>

      <div className="space-y-5">
        {rows.map((row, idx) => (
          <div
            key={row.label}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4 last:border-0 last:pb-0"
          >
            {/* Asset name & progress bar */}
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm font-semibold text-slate-700">
                <span>{row.label}</span>
                <span className="text-slate-400">Current {row.current}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: activeTab === 1 ? `${row.pct}%` : "0%" }}
                  transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                />
              </div>
            </div>

            {/* Action badge */}
            <div className="flex items-center justify-start sm:justify-end sm:pl-6 min-w-[140px]">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border",
                  row.action === "Sell"
                    ? "bg-red-50 text-red-600 border-red-100"
                    : row.action === "Buy"
                    ? "bg-green-50 text-green-600 border-green-100"
                    : "bg-slate-50 text-slate-500 border-slate-100"
                )}
              >
                {row.action} {row.actionVal && ` ${row.actionVal}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Tab 3: SIP Plan Card ---
function SIPPlanCard({ activeTab }: { activeTab: number }) {
  const cards = [
    {
      title: "Parag Parikh Flexi Cap Fund",
      badge: "Flexi Cap",
      badgeColor: "bg-indigo-50 text-[#635bff] border-indigo-100",
      amount: "₹2,500/month",
      months: 8,
    },
    {
      title: "Kotak Emerging Equity Fund",
      badge: "Mid Cap",
      badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
      amount: "₹2,500/month",
      months: 6,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-8 shadow-[0_4px_32px_rgba(99,91,255,0.04)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-slate-50 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#635bff]/10 text-[#635bff] rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-slate-800">Your Monthly SIP Plan</h4>
        </div>
        <span className="inline-block bg-[#635bff]/10 text-[#635bff] px-3.5 py-1 rounded-full text-xs font-semibold self-start sm:self-auto">
          ₹5,000/month
        </span>
      </div>

      <div className="space-y-4">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: -20 }}
            animate={activeTab === 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
              delay: activeTab === 2 ? idx * 0.15 : 0,
            }}
            className="border-l-4 border-l-[#635bff] bg-slate-50/50 p-5 rounded-r-lg border border-y-slate-100 border-r-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h5 className="text-base font-bold text-slate-800">{card.title}</h5>
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border", card.badgeColor)}>
                  {card.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {card.amount} <span className="mx-1.5 text-slate-300">|</span> Months to target: {card.months}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- Main Mockup Component ---
export default function HeroMockup() {
  const [activeTab, setActiveTab] = useState(0);
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tabs = ["Portfolio Health", "Rebalancing", "SIP Plan"];

  const startInterval = () => {
    if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    autoRotateRef.current = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
    }, 3000);
  };

  const stopInterval = () => {
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current);
      autoRotateRef.current = null;
    }
  };

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    stopInterval();

    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }

    resumeTimeoutRef.current = setTimeout(() => {
      startInterval();
    }, 5000);
  };

  useEffect(() => {
    startInterval();
    return () => {
      stopInterval();
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  const renderActiveCard = () => {
    switch (activeTab) {
      case 0:
        return <PortfolioHealthCard activeTab={activeTab} />;
      case 1:
        return <RebalancingCard activeTab={activeTab} />;
      case 2:
        return <SIPPlanCard activeTab={activeTab} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full max-w-[820px] mx-auto flex flex-col items-center">
      {/* 3 Clickable Pill Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-10 z-10">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => handleTabClick(idx)}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all duration-300 border",
              activeTab === idx
                ? "bg-[#635bff] text-white border-[#635bff] shadow-[0_6px_16px_rgba(99,91,255,0.24)]"
                : "bg-transparent text-slate-600 border-slate-200 hover:border-slate-300"
            )}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Decorative blurred gradient circles behind the mockup frame */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-visible">
        {/* Circle 1: 450px, indigo (#635bff), opacity 0.08, top-left */}
        <div className="absolute -top-16 -left-16 w-[450px] h-[450px] bg-[#635bff] opacity-[0.08] blur-[90px] rounded-full pointer-events-none" />
        {/* Circle 2: 350px, blue (#2563eb), opacity 0.06, bottom-right */}
        <div className="absolute -bottom-16 -right-16 w-[350px] h-[350px] bg-[#2563eb] opacity-[0.06] blur-[70px] rounded-full pointer-events-none" />
      </div>

      {/* Mobile-only view: simple card without browser frame / floating effect */}
      <div className="w-full md:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderActiveCard()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Desktop view: browser chrome mockup frame with floating animation */}
      <motion.div
        className="hidden md:block w-full bg-white rounded-2xl border border-slate-100 overflow-hidden"
        style={{
          boxShadow: "0 25px 60px rgba(99,91,255,0.15)",
        }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Browser Chrome Header */}
        <div className="flex items-center px-5 py-4 border-b border-slate-100 bg-white">
          {/* 3 colored dots */}
          <div className="flex space-x-2 mr-8">
            <span className="w-3.5 h-3.5 rounded-full bg-red-400" />
            <span className="w-3.5 h-3.5 rounded-full bg-yellow-400" />
            <span className="w-3.5 h-3.5 rounded-full bg-green-400" />
          </div>
          {/* URL bar */}
          <div className="flex-1 max-w-lg bg-slate-50 border border-slate-100 rounded-lg text-center py-1.5 text-xs sm:text-sm text-slate-400 select-none">
            raidash.app/dashboard
          </div>
          {/* empty space to balance dots */}
          <div className="w-16" />
        </div>

        {/* Browser Chrome Body */}
        <div className="p-10 bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderActiveCard()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
