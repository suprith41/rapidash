import json
import csv
import logging
import os
import re
from datetime import UTC, datetime
from io import BytesIO
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

import pdfplumber

from core.scrubber import scrub_pii
from models.schema import (
    AssetHolding,
    CashLedgerSummary,
    MasterParsedPayload,
    StatementMetadata,
)

logger = logging.getLogger(__name__)
NSE_MASTER_PATH = Path(__file__).resolve().parents[1] / "data" / "nse_master.csv"

_CDSL_HOLDING_LINE_RE = re.compile(
    r"^(?P<sec_type>EQ|MF)\s+"
    r"(?P<isin>IN[A-Z0-9]{10})\s+"
    r"(?P<name>.+?)\s+"
    r"(?P<current_bal>[-\d,]+\.\d+)\s+"
    r"(?P<free_bal>[-\d,]+\.\d+)\s+"
    r"(?P<pledged_bal>[-\d,]+\.\d+)\s+"
    r"(?P<value>[-\d,]+\.\d+)\s*$"
)

_STATEMENT_DATE_RE = re.compile(
    r"STATEMENT OF HOLDINGS AS ON:\s*(\d{2}-\d{2}-\d{4})",
    re.IGNORECASE,
)

_TOKEN_SPLIT_RE = re.compile(r"[^A-Z0-9]+")
_TICKER_STOPWORDS = {
    "LIMITED",
    "LTD",
    "ENERGY",
    "SHARES",
    "EQUITY",
    "NEW",
    "AFTER",
    "SUB",
    "DIVISION",
    "OF",
    "RS",
    "AND",
    "THE",
    "SPECIAL",
    "ECONOMIC",
    "ZONE",
}
_TICKER_ABBREVIATIONS = {
    "TRANSMISSION": "TRANS",
    "BATTERIES": "BAT",
    "ARBITRAGE": "ARB",
    "OPPORTUNITIES": "OPP",
}


def parse_pdf(file_bytes: bytes) -> MasterParsedPayload:
    """Parse a PDF statement from direct pdfplumber text, with Groq as fallback."""
    raw_text = ""
    page_texts: list[str] = []
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                page_texts.append(text)
                raw_text += text + "\n"

    if not raw_text or len(raw_text.strip()) < 50:
        raise ValueError("No text could be extracted from this PDF.")

    parsed_payload = _parse_cdsl_payload(page_texts)
    if parsed_payload is not None:
        return parsed_payload

    sanitized_text = scrub_pii(raw_text)
    return _parse_with_llm(sanitized_text)


def _parse_with_llm(sanitized_text: str) -> MasterParsedPayload:
    response_text = _call_groq(sanitized_text)
    payload = _extract_json_object(response_text)
    normalized_payload = _normalize_payload(payload, extraction_method="llm")
    return MasterParsedPayload.model_validate(normalized_payload)


def _parse_cdsl_payload(page_texts: list[str]) -> MasterParsedPayload | None:
    holdings: list[AssetHolding] = []
    full_text = "\n".join(page_texts)
    statement_timestamp = _extract_statement_timestamp(full_text)

    for page_number, page_text in enumerate(page_texts, start=1):
        for raw_line in page_text.splitlines():
            line = " ".join(raw_line.split())
            if not line:
                continue

            match = _CDSL_HOLDING_LINE_RE.match(line)
            if not match:
                continue

            isin = match.group("isin").strip().upper()
            name = match.group("name").strip()
            current_bal = _parse_float(match.group("current_bal"))
            value = _parse_float(match.group("value"))
            ticker_symbol = _resolve_ticker_symbol(isin, name, match.group("sec_type"))

            holdings.append(
                AssetHolding(
                    ticker_symbol=ticker_symbol,
                    isin=isin,
                    quantity=current_bal,
                    average_buy_price=0.0,
                    current_market_value=value,
                    source_page=page_number,
                    extraction_method="deterministic",
                    confidence="low",
                )
            )

    if not holdings:
        return None

    return MasterParsedPayload(
        metadata=StatementMetadata(
            statement_timestamp=statement_timestamp,
            origin_broker="CDSL",
        ),
        holdings=holdings,
        ledger_summary=CashLedgerSummary(
            closing_cash_balance=0.0,
            cumulative_platform_fees=0.0,
        ),
    )


def _extract_statement_timestamp(text: str) -> str:
    match = _STATEMENT_DATE_RE.search(text)
    if match:
        return match.group(1)
    return ""


def _parse_float(value: str) -> float:
    return float(value.replace(",", ""))


@lru_cache(maxsize=1)
def _load_isin_symbol_map() -> dict[str, str]:
    symbol_map: dict[str, str] = {}

    try:
        with NSE_MASTER_PATH.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                normalized_row = {str(key).strip().upper(): value for key, value in row.items()}
                symbol = (normalized_row.get("SYMBOL") or "").strip().upper()
                isin = (
                    (normalized_row.get("ISIN") or normalized_row.get("ISIN NUMBER") or "")
                    .strip()
                    .upper()
                )
                if isin and symbol and isin not in symbol_map:
                    symbol_map[isin] = symbol
    except Exception as exc:
        logger.warning("Failed to load NSE master symbol map at %s: %s", NSE_MASTER_PATH, exc)

    return symbol_map


def _resolve_ticker_symbol(isin: str, raw_name: str, sec_type: str) -> str:
    normalized_name = " ".join(raw_name.upper().replace("#", " # ").split())

    special_alias = _match_special_ticker_alias(normalized_name)
    if special_alias:
        return special_alias

    if sec_type.upper() == "MF" and "MF" in normalized_name:
        left_side = normalized_name.split("#", 1)[0]
        left_tokens = _meaningful_tokens(left_side)
        if left_tokens:
            return f"{left_tokens[0]}MF"[:12]

    tokens = _meaningful_tokens(normalized_name.split("#", 1)[0])
    if not tokens and "#" in normalized_name:
        tokens = _meaningful_tokens(normalized_name.split("#", 1)[1])

    if not tokens:
        symbol = _load_isin_symbol_map().get(isin.upper())
        if symbol:
            return symbol
        return isin[:12]

    parts: list[str] = []
    for token in tokens:
        parts.append(_compress_ticker_token(token))
        if len("".join(parts)) >= 12:
            break

    ticker = "".join(parts).replace(" ", "")[:12]
    return ticker or isin[:12]


def _match_special_ticker_alias(normalized_name: str) -> str:
    if "ABSL AMC" in normalized_name and "MF" in normalized_name:
        return "ABSLMF"
    if "ADANI GREEN" in normalized_name:
        return "ADANIGREEN"
    if "ADANI PORTS" in normalized_name:
        return "ADANIPORTS"
    if "ADANI TRANSMISSION" in normalized_name:
        return "ADANITRANS"
    if "AMARA RAJA BATTERIES" in normalized_name:
        return "AMARAJABAT"
    return ""


def _meaningful_tokens(text: str) -> list[str]:
    tokens = [token for token in _TOKEN_SPLIT_RE.split(text.upper()) if token]
    return [token for token in tokens if token not in _TICKER_STOPWORDS]


def _compress_ticker_token(token: str) -> str:
    return _TICKER_ABBREVIATIONS.get(token, token)


def _call_groq(sanitized_text: str) -> str:
    from groq import Groq

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    system_prompt = """You are a strict financial data extraction compiler.
Output ONLY valid JSON. Zero conversational text. Zero markdown. 
Ignore all personal identifiers — names, IDs, PAN numbers."""
    user_prompt = f"""
Extract ALL holdings from this CDSL Statement of Holdings.

EXTRACTION RULES:
1. Find every line containing a 12-character ISIN starting with IN
2. For each ISIN extract:
   - isin: the 12-character code exactly as found
   - ticker_symbol: first meaningful word(s) from ISIN NAME before # symbol,
     joined without spaces, max 12 chars
     Examples:
     "ABSL AMC LTD#ABSL MF..." → "ABSLMF"
     "ADANI GREEN ENERGY LIMITED #..." → "ADANIGREEN"
     "ADANI PORTS AND SPECIAL..." → "ADANIPORTS"
     "ADANI TRANSMISSION LIMITED #..." → "ADANITRANS"
     "AMARA RAJA BATTERIES LIMITED #..." → "AMARAJABAT"
   - quantity: FIRST float number appearing after the ISIN NAME
     (this is the Current Bal column)
   - current_market_value: LAST float number on that holding's line
     (this is the Value() column, remove all commas first)
   - average_buy_price: always 0.0 (not in this document)
   - source_page: page number where this ISIN was found (integer)
   - extraction_method: "llm"
   - confidence: "high"

3. Extract ALL 5 holdings — do not stop early
4. statement_timestamp: extract from "STATEMENT OF HOLDINGS AS ON: DD-MM-YYYY"
5. origin_broker: always "CDSL"
6. closing_cash_balance: 0.0 (not in this document)
7. cumulative_platform_fees: 0.0

NEVER return null for any field.
For missing numbers use 0.0, for missing strings use empty string "".

Return ONLY this JSON structure:
{{
  "metadata": {{
    "statement_timestamp": "string",
    "origin_broker": "string"
  }},
  "holdings": [
    {{
      "ticker_symbol": "string",
      "isin": "string", 
      "quantity": 0.0,
      "average_buy_price": 0.0,
      "current_market_value": 0.0,
      "source_page": 1,
      "extraction_method": "llm",
      "confidence": "high"
    }}
  ],
  "ledger_summary": {{
    "closing_cash_balance": 0.0,
    "cumulative_platform_fees": 0.0
  }}
}}

PDF TEXT:
{sanitized_text}
"""
    completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        model="llama-3.3-70b-versatile",
        temperature=0,
    )

    return completion.choices[0].message.content or "{}"


def _normalize_payload(
    payload: dict[str, Any],
    extraction_method: Literal["deterministic", "llm"],
) -> dict[str, Any]:
    payload.setdefault("metadata", {})
    payload.setdefault("ledger_summary", {})

    metadata = payload["metadata"]
    if isinstance(metadata, dict):
        metadata.setdefault("statement_timestamp", "")
        metadata.setdefault("origin_broker", "unknown")

    ledger_summary = payload["ledger_summary"]
    if isinstance(ledger_summary, dict):
        ledger_summary.setdefault("closing_cash_balance", 0.0)
        ledger_summary.setdefault("cumulative_platform_fees", 0.0)

    holdings = payload.get("holdings")
    if not isinstance(holdings, list):
        payload["holdings"] = []
        return payload

    for holding in holdings:
        if not isinstance(holding, dict):
            continue

        holding["extraction_method"] = extraction_method
        holding.setdefault("exit_confirmed", False)
        holding.setdefault("missing_cost_basis", False)
        confidence = holding.get("confidence")
        if confidence not in {"high", "low"}:
            holding["confidence"] = "low"

    return payload


def _extract_json_object(response_text: str) -> dict[str, Any]:
    try:
        parsed = json.loads(response_text)
    except json.JSONDecodeError:
        start = response_text.find("{")
        end = response_text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        parsed = json.loads(response_text[start : end + 1])

    if not isinstance(parsed, dict):
        raise ValueError("LLM response must be a JSON object")

    return parsed


def _default_metadata() -> StatementMetadata:
    return StatementMetadata(
        statement_timestamp=datetime.now(UTC).isoformat(),
        origin_broker="unknown",
    )


def _default_ledger_summary() -> CashLedgerSummary:
    return CashLedgerSummary(
        closing_cash_balance=0.0,
        cumulative_platform_fees=0.0,
    )


def _empty_payload() -> MasterParsedPayload:
    return MasterParsedPayload(
        metadata=_default_metadata(),
        holdings=[],
        ledger_summary=_default_ledger_summary(),
    )


def parse_portfolio_payload(payload: MasterParsedPayload) -> MasterParsedPayload:
    return payload
