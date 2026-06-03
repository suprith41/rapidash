"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useRouter } from "next/navigation";
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
  Shield,
  MessageCircleMore,
} from "lucide-react";
import LandingNavigation from "@/components/LandingNavigation";
import { cn } from "@/lib/utils";

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
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: smoothEase },
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
  const [activeTab, setActiveTab] = useState<"timeline" | "forecast">("timeline");

  const timelineData: ChartPoint[] = [
    { date: "Jan", value: 850000 },
    { date: "Feb", value: 920000 },
    { date: "Mar", value: 1050000 },
    { date: "Apr", value: 1180000 },
    { date: "May", value: 1320000 },
    { date: "Jun", value: 1510000 },
  ];

  const forecastData: ChartPoint[] = [
    { date: "Jun", value: 1510000 },
    { date: "Jul", value: 1680000 },
    { date: "Aug", value: 1820000 },
    { date: "Sep", value: 1990000 },
    { date: "Oct", value: 2150000 },
    { date: "Nov", value: 2380000 },
  ];

  const currentData = activeTab === "timeline" ? timelineData : forecastData;
  const displayValue = activeTab === "timeline" ? "₹15.1L" : "₹23.8L";

  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      className={`${softCard} mx-auto w-full max-w-4xl p-4 sm:p-6`}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#635bff]">
            {activeTab === "timeline" ? "Net Worth" : "Net Worth Forecast"}
          </p>
          <div className="mt-2 text-3xl font-bold tracking-tight text-[#0a2540]">
            {displayValue}
          </div>
        </div>
        <div className="inline-flex w-fit rounded-full bg-[#f6f9fc] p-1 text-xs font-semibold text-[#425466]">
          <button
            className={cn(
              "rounded-full px-3 py-1.5 transition-all duration-200",
              activeTab === "timeline"
                ? "bg-white text-[#635bff] shadow-sm"
                : "text-[#425466] hover:text-[#0a2540]"
            )}
            onClick={() => setActiveTab("timeline")}
            type="button"
          >
            Timeline
          </button>
          <button
            className={cn(
              "rounded-full px-3 py-1.5 transition-all duration-200",
              activeTab === "forecast"
                ? "bg-white text-[#635bff] shadow-sm"
                : "text-[#425466] hover:text-[#0a2540]"
            )}
            onClick={() => setActiveTab("forecast")}
            type="button"
          >
            Forecast
          </button>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer height="100%" minWidth={0} width="100%">
          <AreaChart data={currentData} margin={{ bottom: 0, left: 0, right: 8, top: 8 }}>
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
              strokeDasharray={activeTab === "forecast" ? "4 4" : undefined}
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

function ScrollHighlightAbout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Track relative scroll through the section height
      const totalScrollable = rect.height - windowHeight;
      if (totalScrollable <= 0) return;

      const progress = -rect.top / totalScrollable;
      setScrollProgress(Math.max(0, Math.min(1, progress)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const aboutText =
    "Rapidash turns static broker statements into interactive, secure portfolios. It runs structured AI extractions locally on your device, providing clear provenance and audit trails. By parsing NSE and BSE broker PDFs directly, Rapidash gives you instant advisor-style memos, smart rebalancing maps, and monthly SIP optimizers. Zero servers store your data, ensuring complete financial privacy.";

  const words = aboutText.split(" ");
  const totalWords = words.length;

  // Word highlights complete around 70% of scroll progress
  const activeWordCount = Math.min(
    totalWords,
    Math.floor((scrollProgress / 0.70) * totalWords)
  );

  const showFinalStatement = scrollProgress > 0.75;
  const showCards = scrollProgress > 0.82;

  return (
    <section
      ref={containerRef}
      className="relative bg-[#f6f9fc] px-6"
      style={{ minHeight: "220vh" }}
      id="about"
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center max-w-[1280px] mx-auto py-12">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#635bff] mb-4">
            About Rapidash
          </p>

          <div className="min-h-[16rem] md:min-h-[14rem]">
            <p className="text-xl sm:text-2xl lg:text-3xl font-semibold leading-relaxed tracking-tight select-none">
              {words.map((word, index) => {
                const isActive = index < activeWordCount;
                return (
                  <span
                    key={index}
                    className="transition-colors duration-300 mr-2 inline-block"
                    style={{
                      color: isActive ? "#0a2540" : "#cbd5e1",
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          </div>

          <div className="mt-8 h-8">
            <AnimatePresence>
              {showFinalStatement && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl sm:text-2xl font-black text-[#635bff]"
                >
                  Your data stays yours. Forever.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Features list fading in */}
        <div className="mt-10 hidden md:block">
          <AnimatePresence>
            {showCards && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={staggerVariants}
                className="grid grid-cols-3 gap-6"
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
                      className={`${softCard} p-8 border border-slate-100`}
                      key={feature.title}
                      variants={itemVariants}
                    >
                      <div className="flex size-11 items-center justify-center rounded-lg bg-[#635bff]/10 text-[#635bff] shadow-[0_4px_12px_rgba(99,91,255,0.08)]">
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
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const router = useRouter();

  function scrollToSection(sectionId: string) {
    if (sectionId === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleUploadClick() {
    router.push("/dashboard");
  }

  function handleHowItWorksClick() {
    scrollToSection("workflow");
  }

  return (
    <>
      <LandingNavigation onUploadClick={handleUploadClick} onSectionClick={scrollToSection} />

      <main className="bg-white font-sans text-[#0a2540]">
        <section className="overflow-hidden bg-white px-6 pb-20 pt-36 sm:pt-44">
          <motion.div
            animate="visible"
            className="mx-auto max-w-[1280px] text-center"
            initial="hidden"
            variants={sectionVariants}
          >
            <SectionLabel>Privacy-first wealth tracking</SectionLabel>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-[#0a2540] sm:text-[52px]">
              Your entire financial picture. No middleman.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#425466] sm:text-lg">
              Drop your Indian broker statement (NSE/BSE) to get instant local portfolio insights,
              dividend forecasts, and audit trails. Rapidash runs fully private, local extraction
              with clear provenance and complete data ownership.
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

        <ScrollHighlightAbout />

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
                  title: "Go to your dashboard",
                  desc: "Click 'Upload Statement' to open your private dashboard, drop your statement PDF, and run the parser locally.",
                },
                {
                  num: "2",
                  title: "Inspect notes & chat with Dash",
                  desc: "Read advisor-style memo summaries of risks or ask Dash anything to understand NSE audit trails and provenance.",
                },
                {
                  num: "3",
                  title: "Review rebalancing & SIPs",
                  desc: "Optimize your investments using automated health scores, target rebalancing suggestions, and monthly SIP plans.",
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
                  Rapidash
                </div>
                <p className="mt-2 text-sm text-[#425466]">
                  Built for privacy-conscious Indian investors
                </p>
              </div>
            </div>
            <p className="pt-8 text-sm text-[#697386]">
              © {new Date().getFullYear()} Rapidash. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
