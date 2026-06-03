"use client";

import React, { memo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import type { AssetHolding as ParsedAssetHolding } from "@/lib/types";
import { cn } from "@/lib/utils";

export type AssetHolding = ParsedAssetHolding & {
  source_pdf_filename?: string;
  source_table_row?: number;
};

type LedgerTableProps = {
  assets?: AssetHolding[];
};

const mockAssets: AssetHolding[] = [
  {
    ticker_symbol: "INFY",
    isin: "INE009A01021",
    quantity: 42.5,
    average_buy_price: 1428.35,
    current_market_value: 68942.25,
    source_page: 4,
    extraction_method: "deterministic",
    confidence: "high",
    exit_confirmed: false,
    source_pdf_filename: "consolidated-holdings-may-2026.pdf",
    source_table_row: 12,
  },
  {
    ticker_symbol: "TCS",
    isin: "INE467B01029",
    quantity: 18,
    average_buy_price: 3510.8,
    current_market_value: 70326,
    source_page: 5,
    extraction_method: "llm",
    confidence: "high",
    exit_confirmed: false,
    source_pdf_filename: "consolidated-holdings-may-2026.pdf",
    source_table_row: 18,
  },
  {
    ticker_symbol: "HDFCBANK",
    isin: "INE040A01034",
    quantity: 31.75,
    average_buy_price: 1588.4,
    current_market_value: 54229.25,
    source_page: 6,
    extraction_method: "deterministic",
    confidence: "high",
    exit_confirmed: false,
    source_pdf_filename: "broker-ledger-q4.pdf",
    source_table_row: 7,
  },
  {
    ticker_symbol: "RELIANCE",
    isin: "INE002A01018",
    quantity: 12.2,
    average_buy_price: 2864.1,
    current_market_value: 36539,
    source_page: 8,
    extraction_method: "llm",
    confidence: "low",
    exit_confirmed: false,
    source_pdf_filename: "broker-ledger-q4.pdf",
    source_table_row: 15,
  },
];

const drawerTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
} as const;

const inrFormatter = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

const quantityFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 4,
});

function AuditDrawer({
  asset,
  onClose,
}: {
  asset: AssetHolding | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {asset ? (
        <>
          {/* Backdrop */}
          <motion.button
            aria-label="Close audit drawer"
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            type="button"
          />
          {/* Drawer body */}
          <motion.aside
            animate={{ x: 0 }}
            className="fixed right-0 top-0 z-[70] flex h-dvh w-full max-w-[420px] flex-col border-l border-slate-100 bg-white p-6 shadow-[0_24px_80px_rgba(10,37,64,0.12)]"
            exit={{ x: 420 }}
            initial={{ x: 420 }}
            transition={drawerTransition}
          >
            <div className="flex items-start justify-between gap-4">
              <motion.div layoutId={`asset-row-${asset.isin}`}>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#635bff]">
                  Audit Trail
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-800">
                  {asset.ticker_symbol}
                </h2>
              </motion.div>
              <button
                aria-label="Close audit drawer"
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 transition hover:border-[#635bff]/50 hover:text-slate-700"
                onClick={onClose}
                type="button"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>

            <div className="mt-8 space-y-4 text-sm overflow-y-auto pr-1">
              <AuditField label="ISIN" value={asset.isin} />
              <AuditField
                label="Source PDF"
                value={asset.source_pdf_filename ?? "Source filename unavailable"}
              />
              <AuditField label="Page Number" value={asset.source_page} />
              <AuditField
                label="Table Row Number"
                value={asset.source_table_row ?? "Not provided"}
              />
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Extraction Method
                </div>
                <div className="mt-3">
                  <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold capitalize">
                    {asset.extraction_method}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Confidence Score
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-slate-700 font-semibold">
                  {asset.confidence === "high" ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="size-4 text-amber-500" />
                  )}
                  <span>{asset.confidence === "high" ? "High" : "Low"}</span>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function AuditField({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 break-words font-semibold text-slate-700">{value}</div>
    </div>
  );
}

function LedgerTable({ assets = [] }: LedgerTableProps) {
  const [selectedAsset, setSelectedAsset] = useState<AssetHolding | null>(null);
  const holdings = assets.length > 0 ? assets : mockAssets;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header section inside the card */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#635bff]">
            Holdings
          </p>
          <h3 className="text-lg font-bold text-slate-800 mt-1">
            Asset Allocation Ledger
          </h3>
        </div>
        {/* "5 positions" count pill on top right */}
        <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-xs font-semibold text-slate-500">
          {holdings.length} {holdings.length === 1 ? "position" : "positions"}
        </span>
      </div>

      {/* Table grid (no outer border, clean rows) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 pb-3">
              <th className="pb-3 text-[10px] uppercase font-medium text-slate-400 tracking-wider">
                Ticker
              </th>
              <th className="pb-3 text-[10px] uppercase font-medium text-slate-400 tracking-wider">
                ISIN
              </th>
              <th className="pb-3 text-right text-[10px] uppercase font-medium text-slate-400 tracking-wider">
                Quantity
              </th>
              <th className="pb-3 text-right text-[10px] uppercase font-medium text-slate-400 tracking-wider">
                Avg Buy Price
              </th>
              <th className="pb-3 text-right text-[10px] uppercase font-medium text-slate-400 tracking-wider">
                Current Value
              </th>
              <th className="pb-3 text-center text-[10px] uppercase font-medium text-slate-400 tracking-wider">
                Extraction Method
              </th>
              <th className="pb-3 text-right text-[10px] uppercase font-medium text-slate-400 tracking-wider">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((asset) => (
              <tr
                className="cursor-pointer border-b border-slate-100 hover:bg-[#fafafa] transition-colors h-12"
                key={`${asset.isin}-${asset.ticker_symbol}`}
                onClick={() => setSelectedAsset(asset)}
              >
                {/* Ticker Name */}
                <td className="pr-4 py-2 font-bold text-slate-800">
                  {asset.ticker_symbol}
                </td>
                
                {/* ISIN */}
                <td className="pr-4 py-2 font-mono text-[10px] text-slate-400">
                  {asset.isin}
                </td>
                
                {/* Quantity */}
                <td className="pr-4 py-2 text-right text-slate-500 font-medium">
                  {quantityFormatter.format(asset.quantity)}
                </td>
                
                {/* Average Price */}
                <td className="pr-4 py-2 text-right text-slate-500 font-medium">
                  {inrFormatter.format(asset.average_buy_price)}
                </td>
                
                {/* Current Value (Bold Indigo) */}
                <td className="pr-4 py-2 text-right font-bold text-[#635bff]">
                  {inrFormatter.format(asset.current_market_value)}
                </td>
                
                {/* Extraction Method (Tiny Gray Badge) */}
                <td className="px-4 py-2 text-center">
                  <span className="inline-block bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-md text-[10px] font-medium">
                    {asset.extraction_method}
                  </span>
                </td>
                
                {/* Confidence Badge (Green/Amber Pill) */}
                <td className="pl-4 py-2 text-right">
                  <span
                    className={cn(
                      "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                      asset.confidence === "high"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"
                    )}
                  >
                    {asset.confidence === "high" ? "High" : "Low"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AuditDrawer
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  );
}

export default memo(LedgerTable);
