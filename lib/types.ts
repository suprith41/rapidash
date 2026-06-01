export type PrivacyMode = "cloud" | "local";

export interface AssetHolding {
  ticker_symbol: string;
  isin: string;
  quantity: number;
  average_buy_price: number;
  current_market_value: number;
  source_page: number;
  extraction_method: "deterministic" | "llm";
  confidence: "high" | "low";
  exit_confirmed: boolean;
}

export interface CashLedgerSummary {
  closing_cash_balance: number;
  cumulative_platform_fees: number;
}

export interface StatementMetadata {
  statement_timestamp: string;
  origin_broker: string;
}

export interface MasterParsedPayload {
  metadata: StatementMetadata;
  holdings: AssetHolding[];
  ledger_summary: CashLedgerSummary;
}

export interface TransactionLedgerEntry {
  ticker_symbol: string;
  isin: string;
  transaction_type: "buy" | "sell";
  quantity: number;
  transaction_date: string;
}

export interface DividendForecastPoint {
  date: string;
  projected_yield: number;
}

export interface AnalyzeResponse {
  merged_sessions: MasterParsedPayload[];
  dividend_forecast: DividendForecastPoint[];
}
