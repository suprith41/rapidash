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
  missing_cost_basis?: boolean;
}

export interface CashLedgerSummary {
  closing_cash_balance: number;
  cumulative_platform_fees: number;
}

export interface StatementMetadata {
  statement_timestamp: string;
  origin_broker: string;
}

export interface HealthScoreBreakdown {
  label: string;
  score: number;
  max: number;
  message: string;
}

export interface HealthScore {
  score: number;
  grade: "A" | "B" | "C" | "D";
  grade_label: string;
  color: "green" | "blue" | "amber" | "red";
  breakdown: HealthScoreBreakdown[];
  total_portfolio_value: number;
}

export interface RebalancingSuggestion {
  category: string;
  current_value: number;
  ideal_value: number;
  difference: number;
  difference_pct: number;
  action: "hold" | "buy" | "sell";
  action_label: string;
}

export interface Rebalancing {
  total_portfolio_value: number;
  suggestions: RebalancingSuggestion[];
  summary: string;
}

export interface SipAllocation {
  category: string;
  monthly_amount: number;
  fund_name: string;
  fund_isin: string;
  fund_category: string;
  min_sip: number;
  months_to_target: number;
  action_label: string;
}

export interface SipPlan {
  monthly_budget: number;
  total_monthly_sip?: number;
  allocations: SipAllocation[];
  message: string;
}

export interface MasterParsedPayload {
  metadata: StatementMetadata;
  holdings: AssetHolding[];
  ledger_summary: CashLedgerSummary;
  health_score?: HealthScore | null;
  rebalancing?: Rebalancing | null;
  sip_plan?: SipPlan | null;
  investment_memo?: string | null;
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
