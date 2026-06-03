"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "@/contexts/SessionContext";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Download,
  LayoutDashboard,
  TrendingUp,
  Target,
  MessageSquare,
} from "lucide-react";

type DashboardLayoutProps = {
  children: React.ReactNode;
  title: string;
};

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { session, handleClearSession, handleExportClick, isExporting, isLoading } = useSession();
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { label: "Insights", path: "/insights", icon: TrendingUp },
    { label: "Plan", path: "/plan", icon: Target },
    { label: "Chat with Dash", path: "/chat", icon: MessageSquare },
  ];

  // While checking session loading state, show a clean indicator
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f8f9fc]">
        <Loader2 className="h-8 w-8 animate-spin text-[#635bff]" />
      </div>
    );
  }

  // If redirecting or no session, return null (SessionContext will handle redirect)
  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-gradient-to-br from-[#eef2ff] via-[#e0e7ff] to-[#c7d2fe]">
      {/* Fixed Left Sidebar */}
      <aside className="w-[220px] h-full bg-white border-r border-[#e2e8f0] flex flex-col shrink-0">
        {/* Sidebar Top: Branding */}
        <Link
          href="/"
          className="p-6 border-b border-slate-100 block hover:opacity-80 transition-opacity"
        >
          <div className="text-xl font-black text-slate-800 tracking-tight">Rapidash</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Portfolio
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center px-6 h-[44px] text-sm transition-all duration-200 border-l-[3px] gap-[10px]",
                  isActive
                    ? "border-l-[#635bff] text-[#635bff] bg-[#f5f3ff] font-semibold"
                    : "border-l-transparent text-[#64748b] hover:text-[#0a2540] hover:bg-[#f8fafc] font-normal"
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    "shrink-0 transition-colors duration-200",
                    isActive ? "text-[#635bff]" : "text-[#94a3b8]"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Bottom */}
        <div className="p-6 border-t border-slate-100 space-y-3">
          {session.metadata?.statement_timestamp && (
            <div className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-md text-center break-all">
              Date: {session.metadata.statement_timestamp}
            </div>
          )}
          <button
            onClick={handleClearSession}
            className="w-full text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline transition text-center block"
            type="button"
          >
            Clear Session
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className="h-[60px] bg-white border-b border-[#e2e8f0] flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-bold text-[#0a2540]">{title}</h1>

          <button
            onClick={handleExportClick}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-lg border border-[#635bff] px-4 py-1.5 text-sm font-bold text-[#635bff] bg-transparent hover:bg-[#635bff] hover:text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            type="button"
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            <span>Export PDF</span>
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#f8f9fc]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
