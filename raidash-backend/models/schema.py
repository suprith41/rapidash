from typing import List, Literal, Optional

from pydantic import BaseModel


class AssetHolding(BaseModel):
    ticker_symbol: str
    isin: str
    quantity: float
    average_buy_price: float
    current_market_value: float
    source_page: int
    extraction_method: Literal["deterministic", "llm"]
    confidence: Literal["high", "low"]
    exit_confirmed: bool = False
    missing_cost_basis: bool = False


class CashLedgerSummary(BaseModel):
    closing_cash_balance: float
    cumulative_platform_fees: float


class StatementMetadata(BaseModel):
    statement_timestamp: str
    origin_broker: str


class MasterParsedPayload(BaseModel):
    metadata: StatementMetadata
    holdings: List[AssetHolding]
    ledger_summary: CashLedgerSummary
    health_score: Optional[dict] = None
    rebalancing: Optional[dict] = None
    sip_plan: Optional[dict] = None
    investment_memo: Optional[str] = None


class TransactionLedgerEntry(BaseModel):
    ticker_symbol: str
    isin: str
    transaction_type: Literal["buy", "sell"]
    quantity: float
    transaction_date: str
