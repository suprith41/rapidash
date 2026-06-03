"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  loadSession,
  saveSession as saveSessionToStorage,
  clearSession as clearSessionFromStorage,
} from "@/lib/storage";
import { analyzeSessions } from "@/lib/api";
import { exportPortfolioReport } from "@/lib/exportReport";
import type { MasterParsedPayload } from "@/lib/types";

type ChartPoint = {
  date: string;
  value: number;
};

type SessionContextType = {
  session: MasterParsedPayload | null;
  forecastData: ChartPoint[] | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  isExporting: boolean;
  handleClearSession: () => void;
  handleExportClick: () => Promise<void>;
  setSession: (session: MasterParsedPayload | null) => void;
  isLoading: boolean;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<MasterParsedPayload | null>(null);
  const [forecastData, setForecastData] = useState<ChartPoint[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = loadSession();
      if (stored) {
        setSessionState(stored);
      }
    } catch (e) {
      console.error("Error loading session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run AI analysis when session changes
  useEffect(() => {
    if (!session) {
      setForecastData(null);
      setIsAnalyzing(false);
      setAnalysisError(null);
      return;
    }

    let cancelled = false;
    const activeSession = session;

    async function runAnalysis() {
      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const response = await analyzeSessions([activeSession]);
        if (cancelled) return;

        setForecastData(
          response.dividend_forecast.map((point) => ({
            date: point.date,
            value: point.projected_yield,
          }))
        );
      } catch (err) {
        if (!cancelled) {
          setForecastData(null);
          setAnalysisError(
            "The analysis API could not be reached. Your uploaded session is still available locally."
          );
        }
      } finally {
        if (!cancelled) {
          setIsAnalyzing(false);
        }
      }
    }

    void runAnalysis();

    return () => {
      cancelled = true;
    };
  }, [session]);

  // Protect App Routes: If no session, redirect to / (landing page)
  useEffect(() => {
    if (isLoading) return;

    const isAppRoute =
      pathname === "/dashboard" ||
      pathname === "/insights" ||
      pathname === "/plan" ||
      pathname === "/chat";

    if (!session && isAppRoute) {
      router.push("/");
    }
  }, [session, isLoading, pathname, router]);

  const setSession = (data: MasterParsedPayload | null) => {
    setSessionState(data);
    if (data) {
      saveSessionToStorage(data);
    } else {
      clearSessionFromStorage();
    }
  };

  const handleClearSession = () => {
    clearSessionFromStorage();
    setSessionState(null);
    setForecastData(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
    router.push("/");
  };

  const handleExportClick = async () => {
    if (!session || isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      await exportPortfolioReport(session);
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        forecastData,
        isAnalyzing,
        analysisError,
        isExporting,
        handleClearSession,
        handleExportClick,
        setSession,
        isLoading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
