"use client";

import { motion } from "framer-motion";
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

type LandingNavigationProps = {
  onUploadClick: () => void;
  onSectionClick: (sectionId: string) => void;
};

const navItems = [
  { label: "About", sectionId: "about" },
  { label: "Workflow", sectionId: "workflow" },
];

export default function LandingNavigation({
  onUploadClick,
  onSectionClick,
}: LandingNavigationProps) {
  return (
    <motion.header
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/30 bg-white/40 backdrop-blur-md shadow-[0_4px_30px_rgba(99,91,255,0.04)]"
      initial={{ y: -12, opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mx-auto flex h-22 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:h-24 sm:px-6 lg:px-8">
        {/* Left: Branding */}
        <div className="flex flex-1 justify-start">
          <button
            className={`${merriweather.className} text-3xl font-black tracking-tight text-[#0a2540] hover:opacity-85 transition`}
            onClick={() => onSectionClick("top")}
            type="button"
          >
            Rapidash
          </button>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex justify-center">
          <div className="flex items-center gap-3">
            {navItems.map((item) => (
              <button
                className="rounded-full px-5 py-2.5 text-base font-semibold text-[#425466] transition hover:text-[#635bff]"
                key={item.sectionId}
                onClick={() => onSectionClick(item.sectionId)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Right: Actions */}
        <div className="flex flex-1 justify-end">
          <button
            className="inline-flex rounded-full bg-[#635bff] px-5 py-2.5 text-base font-bold text-white shadow-[0_10px_22px_rgba(99,91,255,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(99,91,255,0.26)]"
            onClick={onUploadClick}
            type="button"
          >
            Upload Statement
          </button>
        </div>
      </div>
    </motion.header>
  );
}
