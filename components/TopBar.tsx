import type { ReactNode } from "react";
import Link from "next/link";

export function TopBarContent({ actions }: { actions?: ReactNode } = {}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/30 bg-white/40 backdrop-blur-md shadow-[0_4px_30px_rgba(99,91,255,0.04)]">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-sans text-xl font-semibold tracking-tight text-[#0a2540] hover:opacity-80 transition-opacity"
        >
          Rapidash
        </Link>
        <div className="flex items-center gap-3">
          {actions}
        </div>
      </div>
    </header>
  );
}

export default function TopBar() {
  return <TopBarContent />;
}
