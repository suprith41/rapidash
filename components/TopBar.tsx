"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LayoutGroup, motion } from "framer-motion";
import { loadMode, saveMode, type PrivacyMode } from "@/lib/storage";
import { cn } from "@/lib/utils";

type PrivacyModeContextValue = {
  mode: PrivacyMode;
  setMode: (mode: PrivacyMode) => void;
};

export const PrivacyModeContext = createContext<PrivacyModeContextValue>({
  mode: "local",
  setMode: () => undefined,
});

const modes: Array<{
  value: PrivacyMode;
  label: string;
  detail: string;
}> = [
  {
    value: "cloud",
    label: "Cloud API",
    detail: "Fast",
  },
  {
    value: "local",
    label: "Local-First",
    detail: "Private",
  },
];

export function PrivacyModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<PrivacyMode>("local");

  useEffect(() => {
    setModeState(loadMode());
  }, []);

  const setMode = useCallback((nextMode: PrivacyMode) => {
    setModeState(nextMode);
    saveMode(nextMode);
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <PrivacyModeContext.Provider value={value}>
      {children}
    </PrivacyModeContext.Provider>
  );
}

export function usePrivacyMode() {
  return useContext(PrivacyModeContext);
}

function PrivacyModeToggle() {
  const { mode, setMode } = usePrivacyMode();

  return (
    <LayoutGroup>
      <div
        aria-label="Privacy mode"
        className="relative flex rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-[0_0_24px_rgba(124,58,237,0.16)]"
        role="radiogroup"
      >
        {modes.map((item) => {
          const isActive = item.value === mode;

          return (
            <button
              aria-checked={isActive}
              className={cn(
                "relative z-10 flex items-center justify-center rounded-full px-2.5 py-2 text-xs font-medium transition-colors duration-200 sm:min-w-[8.75rem] sm:px-4 sm:text-sm",
                isActive
                  ? "text-white"
                  : "text-muted hover:text-slate-200"
              )}
              key={item.value}
              onClick={() => setMode(item.value)}
              role="radio"
              type="button"
            >
              {isActive ? (
                <motion.span
                  className="absolute inset-0 -z-10 rounded-full bg-accent-gradient shadow-[0_0_28px_rgba(124,58,237,0.42)]"
                  layoutId="privacy-mode-active-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span>{item.label}</span>
              <span className="ml-1 text-xs opacity-75">({item.detail})</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

export function TopBarContent({ actions }: { actions?: ReactNode } = {}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/72 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <div className="font-sans text-xl font-semibold tracking-tight text-foreground drop-shadow-[0_0_14px_rgba(124,58,237,0.42)]">
          Raidash
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <PrivacyModeToggle />
        </div>
      </div>
    </header>
  );
}

export default function TopBar() {
  return (
    <PrivacyModeProvider>
      <TopBarContent />
    </PrivacyModeProvider>
  );
}
