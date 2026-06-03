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
      className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none"
      initial={{ y: -12, opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="w-[95%] max-w-6xl border border-white/40 bg-white/30 backdrop-blur-md shadow-[0_12px_32px_rgba(99,91,255,0.06)] rounded-full px-6 pointer-events-auto">
        <div className="flex h-16 w-full items-center justify-between gap-4">
          {/* Left: Branding */}
          <div className="flex flex-1 justify-start">
            <button
              className={`${merriweather.className} text-2xl font-black tracking-tight text-[#0a2540] hover:opacity-85 transition`}
              onClick={() => onSectionClick("top")}
              type="button"
            >
              Rapidash
            </button>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden lg:flex justify-center">
            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                <button
                  className="rounded-full px-4.5 py-2 text-sm font-bold text-[#425466] transition hover:text-[#635bff]"
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
              className="inline-flex rounded-full bg-[#635bff] px-8 py-2 text-sm font-bold text-white shadow-[0_8px_18px_rgba(99,91,255,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(99,91,255,0.22)]"
              onClick={onUploadClick}
              type="button"
            >
              Upload Statement
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
