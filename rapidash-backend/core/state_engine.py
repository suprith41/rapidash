from datetime import UTC, datetime
from typing import List, TypedDict

from models.schema import AssetHolding, MasterParsedPayload, TransactionLedgerEntry


class DividendProjection(TypedDict):
    date: str
    projected_yield: float


def merge_sessions(
    sessions: List[MasterParsedPayload],
    transactions: List[TransactionLedgerEntry],
) -> List[MasterParsedPayload]:
    sorted_sessions = sorted(
        (session.model_copy(deep=True) for session in sessions),
        key=lambda session: session.metadata.statement_timestamp,
    )

    for index in range(1, len(sorted_sessions)):
        previous_session = sorted_sessions[index - 1]
        current_session = sorted_sessions[index]

        previous_holdings = {
            _asset_key(holding): holding for holding in previous_session.holdings
        }
        current_holdings = {
            _asset_key(holding): holding for holding in current_session.holdings
        }

        missing_asset_keys = previous_holdings.keys() - current_holdings.keys()

        for asset_key in missing_asset_keys:
            previous_holding = previous_holdings[asset_key]
            sell_found = _has_sell_transaction_between(
                previous_holding,
                previous_session.metadata.statement_timestamp,
                current_session.metadata.statement_timestamp,
                transactions,
            )

            if sell_found:
                previous_holding.exit_confirmed = True
            else:
                ghost_holding = previous_holding.model_copy(
                    update={"exit_confirmed": False}
                )
                current_session.holdings.append(ghost_holding)

    return sorted_sessions


def project_dividends(holdings: List[AssetHolding]) -> List[DividendProjection]:
    monthly_projection = sum(
        (holding.average_buy_price * holding.quantity * 0.015) / 12
        for holding in holdings
        if not holding.exit_confirmed
    )
    current_month = datetime.now(UTC)

    return [
        {
            "date": _add_months(current_month, month_offset).strftime("%Y-%m-%d"),
            "projected_yield": round(monthly_projection, 2),
        }
        for month_offset in range(1, 13)
    ]




def _has_sell_transaction_between(
    holding: AssetHolding,
    previous_timestamp: str,
    current_timestamp: str,
    transactions: List[TransactionLedgerEntry],
) -> bool:
    holding_ticker = holding.ticker_symbol.strip().upper()
    holding_isin = holding.isin.strip().upper()

    for transaction in transactions:
        if transaction.transaction_type != "sell":
            continue

        ticker_matches = transaction.ticker_symbol.strip().upper() == holding_ticker
        isin_matches = transaction.isin.strip().upper() == holding_isin
        date_in_range = (
            previous_timestamp
            < transaction.transaction_date
            <= current_timestamp
        )

        if ticker_matches and isin_matches and date_in_range:
            return True

    return False


def _asset_key(holding: AssetHolding) -> tuple[str, str]:
    return holding.ticker_symbol.strip().upper(), holding.isin.strip().upper()


def _add_months(value: datetime, month_offset: int) -> datetime:
    month_index = value.month - 1 + month_offset
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, _days_in_month(year, month))

    return value.replace(year=year, month=month, day=day)


def _days_in_month(year: int, month: int) -> int:
    if month == 2:
        if year % 400 == 0 or (year % 4 == 0 and year % 100 != 0):
            return 29
        return 28

    if month in {4, 6, 9, 11}:
        return 30

    return 31
