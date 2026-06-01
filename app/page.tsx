"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import AIMemoCard from "@/components/AIMemoCard";
import LedgerTable from "@/components/LedgerTable";
import NetWorthChart from "@/components/NetWorthChart";
import TopBar from "@/components/TopBar";
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

export default function Home() {
  return (
    <>
      <TopBar />
      <main className="min-h-screen bg-background px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <motion.div
          animate="visible"
          className="dashboard-grid mx-auto grid w-full max-w-7xl gap-4 lg:gap-6"
          initial="hidden"
          variants={gridVariants}
        >
          <GlassCard area="hero">
            <NetWorthChart />
          </GlassCard>
          <GlassCard area="memo">
            <AIMemoCard />
          </GlassCard>
          <GlassCard area="ledger">
            <LedgerTable />
          </GlassCard>
        </motion.div>
      </main>
    </>
  );
}
