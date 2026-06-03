import type { ReactNode } from "react";

export function TopBarContent({ actions }: { actions?: ReactNode } = {}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/72 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <div className="font-sans text-xl font-semibold tracking-tight text-foreground drop-shadow-[0_0_14px_rgba(124,58,237,0.42)]">
          Raidash
        </div>
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
