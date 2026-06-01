from typing import List, Literal

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


class TransactionLedgerEntry(BaseModel):
    ticker_symbol: str
    isin: str
    transaction_type: Literal["buy", "sell"]
    quantity: float
    transaction_date: str
