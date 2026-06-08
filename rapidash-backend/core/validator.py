import logging
from pathlib import Path
from typing import List, Literal

import pandas as pd

from models.schema import AssetHolding


logger = logging.getLogger(__name__)

NSE_MASTER_PATH = Path(__file__).resolve().parents[1] / "data" / "nse_master.csv"


def _load_nse_master() -> tuple[set[str], set[str]] | None:
    try:
        nse_master = pd.read_csv(NSE_MASTER_PATH)
    except Exception as exc:
        logger.warning("Failed to load NSE master CSV at %s: %s", NSE_MASTER_PATH, exc)
        return None

    nse_master.columns = [str(column).strip() for column in nse_master.columns]

    if "SYMBOL" not in nse_master.columns:
        logger.warning("NSE master CSV missing SYMBOL column")
        return None

    isin_column = "ISIN" if "ISIN" in nse_master.columns else "ISIN NUMBER"
    if isin_column not in nse_master.columns:
        logger.warning("NSE master CSV missing ISIN column")
        return None

    symbols = set(nse_master["SYMBOL"].dropna().astype(str).str.strip().str.upper())
    isins = set(nse_master[isin_column].dropna().astype(str).str.strip().str.upper())

    return symbols, isins


NSE_MASTER_CACHE = _load_nse_master()


def validate_holdings(holdings: List[AssetHolding]) -> List[AssetHolding]:
    if NSE_MASTER_CACHE is None:
        return [_holding_with_confidence(holding, "low") for holding in holdings]

    symbols, isins = NSE_MASTER_CACHE
    validated_holdings: list[AssetHolding] = []

    for holding in holdings:
        isin_matches = holding.isin.strip().upper() in isins
        ticker_matches = holding.ticker_symbol.strip().upper() in symbols
        confidence = "high" if isin_matches or ticker_matches else "low"

        validated_holdings.append(_holding_with_confidence(holding, confidence))

    return validated_holdings




def _holding_with_confidence(
    holding: AssetHolding, confidence: Literal["high", "low"]
) -> AssetHolding:
    return holding.model_copy(update={"confidence": confidence})
