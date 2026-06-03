"use client";

type LandingNavigationProps = {
  onUploadClick: () => void;
};

export default function LandingNavigation({ onUploadClick }: LandingNavigationProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-8 px-6">
        <div className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-3">
          <div className="text-lg font-bold tracking-[-0.03em] text-[#0a2540]">Raidash</div>
          <div className="hidden text-xs font-medium text-[#425466] sm:block">Financial clarity. Privately.</div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <button
            className="rounded-lg bg-[#635bff] px-4 py-2 text-sm font-bold text-white shadow-[0_8px_18px_rgba(99,91,255,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(99,91,255,0.28)]"
            onClick={onUploadClick}
            type="button"
          >
            Upload Statement
          </button>
        </div>
      </div>
    </header>
  );
}
