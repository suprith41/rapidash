"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  X,
} from "lucide-react";
import LandingNavigation from "@/components/LandingNavigation";
import LandingJourney from "@/components/LandingJourney";
import UploadZone from "@/components/UploadZone";
import { useSession } from "@/contexts/SessionContext";

const smoothEase = [0.22, 1, 0.36, 1] as const;

const heroContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.16,
    },
  },
};

const heroItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 56,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 1.05,
      ease: smoothEase,
    },
  },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#635bff]">
      {children}
    </p>
  );
}

export default function Home() {
  const router = useRouter();
  const { session, setSession } = useSession();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);


  function scrollToSection(sectionId: string) {
    if (sectionId === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleUploadClick() {
    if (session) {
      router.push("/dashboard");
    } else {
      setIsUploadModalOpen(true);
    }
  }

  function handleHowItWorksClick() {
    scrollToSection("workflow");
  }

  return (
    <>
      <LandingNavigation onUploadClick={handleUploadClick} onSectionClick={scrollToSection} />

      <main className="bg-gradient-to-br from-[#fafaff] via-[#f5f3ff] to-[#eef2ff] font-sans text-[#0a2540]">
        <section
          className="flex min-h-[680px] items-start overflow-hidden bg-[#dcecf3] bg-center bg-no-repeat px-6 pb-24 pt-36 sm:min-h-[780px] sm:pt-44 lg:min-h-[820px]"
          style={{
            backgroundImage: "url('/hero-background.jpg')",
            backgroundPosition: "center center",
            backgroundSize: "104% 104%",
          }}
        >
          <motion.div
            animate="visible"
            className="mx-auto w-full max-w-[1280px] text-center"
            initial="hidden"
            variants={heroContainerVariants}
          >
            <motion.div variants={heroItemVariants}>
              <SectionLabel>Privacy-first wealth tracking</SectionLabel>
            </motion.div>
            <motion.h1
              className="mx-auto mt-6 max-w-5xl text-5xl font-bold leading-[0.98] tracking-[-0.04em] text-[#0a2540] sm:text-6xl lg:text-7xl"
              variants={heroItemVariants}
            >
              <span className="block">Your entire financial picture.</span>
              <span className="block">No middleman.</span>
            </motion.h1>
            <motion.p
              className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#425466] sm:text-lg"
              variants={heroItemVariants}
            >
              Drop your Indian broker statement (NSE/BSE) to get instant local portfolio insights,
              dividend forecasts, and audit trails. Rapidash runs fully private, local extraction
              with clear provenance and complete data ownership.
            </motion.p>
            <motion.div
              className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
              variants={heroItemVariants}
            >
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
            </motion.div>
          </motion.div>
        </section>

        <LandingJourney />

        <footer className="border-t border-slate-200/50 bg-transparent px-6 py-10">
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

      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-lg mx-4 bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 z-10"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
                type="button"
              >
                <X className="size-5" />
              </button>
              
              {/* Header */}
              <div className="mb-6 pr-6">
                <h3 className="text-xl font-bold text-slate-800">Upload Broker Statement</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Upload your NSE/BSE statement PDF. It runs structured AI extractions locally on your device.
                </p>
              </div>

              {/* Upload Zone */}
              <UploadZone
                onSuccess={(data) => {
                  setSession(data);
                  setIsUploadModalOpen(false);
                  router.push("/dashboard");
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
