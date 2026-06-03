"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { clearSession } from "@/lib/storage";
import { cn } from "@/lib/utils";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export function ErrorCard({
  message,
  title = "Analysis unavailable",
}: {
  message: string;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-red-500/35 bg-[#140c10] p-4 shadow-[0_0_28px_rgba(239,68,68,0.18)]",
        "backdrop-blur-xl"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-red-400/35 bg-red-500/10 text-red-300">
          <AlertTriangle aria-hidden className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-100">{title}</p>
          <p className="mt-1 text-sm leading-6 text-red-100/80">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Rapidash dashboard crashed", error, errorInfo);
  }

  handleReset = () => {
    clearSession();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
          <div className="w-full max-w-xl rounded-3xl border border-red-500/35 bg-[#111118] p-6 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-red-400/40 bg-red-500/10 text-red-300 shadow-[0_0_24px_rgba(239,68,68,0.2)]">
                <AlertTriangle aria-hidden className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Dashboard error
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {this.state.error?.message ??
                    "A runtime error occurred while rendering the dashboard."}
                </p>
              </div>
            </div>

            <button
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-red-500/35 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition-colors hover:border-red-400/55 hover:bg-red-500/15"
              onClick={this.handleReset}
              type="button"
            >
              <RefreshCw aria-hidden className="size-4" />
              Reset Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
