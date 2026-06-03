"use client";

import { motion } from "framer-motion";

type LandingNavigationProps = {
  onUploadClick: () => void;
  onSectionClick: (sectionId: string) => void;
};

const navItems = [
  { label: "About", sectionId: "about" },
  { label: "Workflow", sectionId: "workflow" },
  { label: "Dash", sectionId: "dash" },
];

export default function LandingNavigation({
  onUploadClick,
  onSectionClick,
}: LandingNavigationProps) {
  return (
    <motion.header
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/70 bg-white/90 backdrop-blur-xl"
      initial={{ y: -12, opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mx-auto flex h-18 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        <button
          className="flex min-w-0 items-center gap-3 text-left"
          onClick={() => onSectionClick("top")}
          type="button"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#0a2540] text-sm font-black text-white shadow-[0_10px_24px_rgba(10,37,64,0.18)]">
            R
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-bold tracking-[-0.03em] text-[#0a2540]">
              Raidash
            </div>
            <div className="hidden truncate text-xs font-medium text-[#64748b] sm:block">
              Financial clarity for investors
            </div>
          </div>
        </button>

        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => (
            <button
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#425466] transition hover:bg-[#f6f9fc] hover:text-[#0a2540]"
              key={item.sectionId}
              onClick={() => onSectionClick(item.sectionId)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0a2540] transition hover:border-[#635bff]/35 hover:text-[#635bff] sm:inline-flex"
            onClick={() => onSectionClick("upload-section")}
            type="button"
          >
            Upload
          </button>
          <button
            className="inline-flex rounded-full bg-[#635bff] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(99,91,255,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(99,91,255,0.26)]"
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
