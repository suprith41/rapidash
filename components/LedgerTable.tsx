"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { memo, useState } from "react";
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
  style: "currency",
});

const quantityFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 4,
});

function confidenceLabel(confidence: ParsedAssetHolding["confidence"]) {
  return confidence === "high" ? "High" : "Low";
}

function ExtractionBadge({
  method,
}: {
  method: AssetHolding["extraction_method"];
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
        method === "deterministic"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      )}
    >
      {method}
    </span>
  );
}

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
          <motion.button
            aria-label="Close audit drawer"
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-[#0a2540]/30 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            type="button"
          />
          <motion.aside
            animate={{ x: 0 }}
            className="fixed right-0 top-0 z-[70] flex h-dvh w-full max-w-[420px] flex-col border-l border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(10,37,64,0.16)]"
            exit={{ x: 420 }}
            initial={{ x: 420 }}
            transition={drawerTransition}
          >
            <div className="flex items-start justify-between gap-4">
              <motion.div layoutId={`asset-row-${asset.isin}`}>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#635bff]">
                  Audit Trail
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0a2540]">
                  {asset.ticker_symbol}
                </h2>
              </motion.div>
              <button
                aria-label="Close audit drawer"
                className="rounded-full border border-slate-200 bg-white p-2 text-[#425466] transition hover:border-[#635bff]/50 hover:text-[#0a2540]"
                onClick={onClose}
                type="button"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>

            <div className="mt-8 space-y-4 text-sm">
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
              <div className="rounded-xl border border-slate-200 bg-[#f6f9fc] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-muted">
                  Extraction Method
                </div>
                <div className="mt-3">
                  <ExtractionBadge method={asset.extraction_method} />
                </div>
              </div>
              <AuditField
                label="Confidence Score"
                value={confidenceLabel(asset.confidence)}
              />
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
    <div className="rounded-xl border border-slate-200 bg-[#f6f9fc] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-[#697386]">
        {label}
      </div>
      <div className="mt-2 break-words font-medium text-[#0a2540]">{value}</div>
    </div>
  );
}

function LedgerTable({ assets = mockAssets }: LedgerTableProps) {
  const [selectedAsset, setSelectedAsset] = useState<AssetHolding | null>(null);
  const holdings = assets.length > 0 ? assets : mockAssets;

  return (
    <section className="flex h-full min-h-[20rem] flex-col">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#635bff]">
            Ledger
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-[#0a2540]">
            Asset Holdings
          </h2>
        </div>
        <p className="text-sm text-muted">{holdings.length} audited positions</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-[#f6f9fc] text-xs uppercase tracking-[0.12em] text-[#697386]">
              <tr>
                <th className="px-4 py-3 font-medium">Ticker</th>
                <th className="px-4 py-3 font-medium">ISIN</th>
                <th className="px-4 py-3 text-right font-medium">Quantity</th>
                <th className="px-4 py-3 text-right font-medium">
                  Avg Buy Price
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  Current Value
                </th>
                <th className="px-4 py-3 font-medium">Extraction Method</th>
                <th className="px-4 py-3 text-right font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((asset, index) => (
                <motion.tr
                  className={cn(
                    "cursor-pointer border-l-[3px] border-l-transparent transition-colors",
                    index % 2 === 0 ? "bg-white" : "bg-[#f8fafc]",
                    "hover:border-l-[#635bff] hover:bg-[#f6f9fc]"
                  )}
                  key={`${asset.isin}-${asset.ticker_symbol}`}
                  layoutId={`asset-row-${asset.isin}`}
                  onClick={() => setSelectedAsset(asset)}
                  whileHover={{ y: -1 }}
                >
                  <td className="px-4 py-4 font-semibold text-[#0a2540]">
                    {asset.ticker_symbol}
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-[#425466]">
                    {asset.isin}
                  </td>
                  <td className="px-4 py-4 text-right text-[#425466]">
                    {quantityFormatter.format(asset.quantity)}
                  </td>
                  <td className="px-4 py-4 text-right text-[#425466]">
                    {inrFormatter.format(asset.average_buy_price)}
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-[#0a2540]">
                    {inrFormatter.format(asset.current_market_value)}
                  </td>
                  <td className="px-4 py-4">
                    <ExtractionBadge method={asset.extraction_method} />
                  </td>
                  <td className="px-4 py-4 text-right text-[#425466]">
                    {confidenceLabel(asset.confidence)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AuditDrawer
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </section>
  );
}

export default memo(LedgerTable);
