from typing import List

from fastapi import APIRouter, Body
from pydantic import BaseModel, Field

from core.state_engine import merge_sessions, project_dividends
from models.schema import MasterParsedPayload, TransactionLedgerEntry


router = APIRouter()


@router.get("/")
def analyze_status() -> dict[str, str]:
    return {"status": "analyze router ready"}


class AnalyzeRequest(BaseModel):
    sessions: List[MasterParsedPayload]
    transactions: List[TransactionLedgerEntry] = Field(default_factory=list)


class DividendForecastPoint(BaseModel):
    date: str
    projected_yield: float


class AnalyzeResponse(BaseModel):
    merged_sessions: List[MasterParsedPayload]
    dividend_forecast: List[DividendForecastPoint]


@router.post("/", response_model=AnalyzeResponse)
def analyze_portfolio(
    payload: AnalyzeRequest = Body(...),
) -> AnalyzeResponse:
    """Merge statement sessions and project the next twelve dividend periods."""

    merged_sessions = merge_sessions(payload.sessions, payload.transactions)
    latest_holdings = merged_sessions[-1].holdings if merged_sessions else []
    dividend_forecast = project_dividends(latest_holdings)

    return AnalyzeResponse(
        merged_sessions=merged_sessions,
        dividend_forecast=dividend_forecast,
    )
