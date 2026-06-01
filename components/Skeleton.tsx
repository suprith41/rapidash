"use client";

import { cn } from "@/lib/utils";

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("rounded-full bg-slate-200 animate-pulse", className)} />;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("rounded-xl bg-slate-200 animate-pulse", className)} />;
}

export function ChartSkeleton() {
  return (
    <div className="flex h-full min-h-[18rem] flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <SkeletonLine className="h-3 w-20" />
          <SkeletonLine className="h-6 w-56" />
        </div>
        <SkeletonLine className="h-9 w-36" />
      </div>

      <div className="mt-6 flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex h-full flex-col justify-between gap-4">
          <SkeletonBlock className="h-44 w-full" />
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLine key={index} className="h-3" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="flex h-full min-h-[20rem] flex-col">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-3">
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="h-6 w-40" />
        </div>
        <SkeletonLine className="h-4 w-28" />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <div className="bg-slate-50 px-4 py-3">
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLine key={index} className="h-3" />
            ))}
          </div>
        </div>

        <div className="space-y-2 bg-white p-4">
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <div
              className="grid grid-cols-6 gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              key={rowIndex}
            >
              {Array.from({ length: 6 }).map((__, colIndex) => (
                <SkeletonLine
                  key={colIndex}
                  className={cn(
                    "h-3",
                    colIndex === 0 ? "w-16" : colIndex === 1 ? "w-24" : "w-full"
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MemoSkeleton() {
  return (
    <div className="flex h-full min-h-[18rem] flex-col">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-3">
          <SkeletonLine className="h-3 w-32" />
          <SkeletonLine className="h-6 w-36" />
        </div>
        <SkeletonLine className="h-6 w-20 rounded-full bg-emerald-300" />
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            key={index}
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock className="size-9 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonLine className="h-3 w-3/4" />
                <SkeletonLine className="h-3 w-1/2" />
              </div>
              <SkeletonLine className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}