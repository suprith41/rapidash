import json
import os
from datetime import UTC, datetime
from io import BytesIO
from typing import Any, Literal
from urllib import request

import pdfplumber

from core.scrubber import scrub_pii
from models.schema import (
    AssetHolding,
    CashLedgerSummary,
    MasterParsedPayload,
    StatementMetadata,
)


ParseMode = Literal["cloud", "local"]

FIELD_ALIASES = {
    "ticker_symbol": {
        "ticker",
        "ticker symbol",
        "symbol",
        "scrip",
        "security",
        "security name",
    },
    "isin": {"isin", "isin code"},
    "quantity": {"qty", "quantity", "units", "balance quantity"},
    "average_buy_price": {
        "avg buy price",
        "average buy price",
        "average price",
        "avg price",
        "cost price",
    },
    "current_market_value": {
        "current value",
        "market value",
        "current market value",
        "value",
        "valuation",
    },
}

REQUIRED_FIELDS = {
    "ticker_symbol",
    "isin",
    "quantity",
    "average_buy_price",
    "current_market_value",
}


def parse_pdf(file_bytes: bytes, mode: str) -> MasterParsedPayload:
    if mode not in {"cloud", "local"}:
        raise ValueError("mode must be either 'cloud' or 'local'")

    deterministic_failed = False

    try:
        deterministic_payload = _parse_with_pdfplumber_tables(file_bytes)
        if deterministic_payload.holdings:
            return deterministic_payload
        deterministic_failed = True
    except Exception:
        deterministic_failed = True

    if deterministic_failed:
        raw_text = _extract_pdf_text(file_bytes)
        sanitized_text = scrub_pii(raw_text)
        llm_payload = _parse_with_llm(sanitized_text, mode)
        return _force_extraction_method(llm_payload, "llm")

    return _empty_payload()


def _parse_with_pdfplumber_tables(file_bytes: bytes) -> MasterParsedPayload:
    holdings: list[AssetHolding] = []
    table_rows_found = 0

    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page_index, page in enumerate(pdf.pages, start=1):
            tables = page.extract_tables() or []
            for table in tables:
                if not table:
                    continue

                table_rows_found += len(table)
                holdings.extend(_parse_table(table, page_index))

    if table_rows_found == 0:
        return _empty_payload()

    return MasterParsedPayload(
        metadata=_default_metadata(),
        holdings=holdings,
        ledger_summary=_default_ledger_summary(),
    )


def _parse_table(table: list[list[Any]], source_page: int) -> list[AssetHolding]:
    header_index, header_map = _find_header(table)
    if header_index is None:
        return []

    parsed_holdings: list[AssetHolding] = []

    for row in table[header_index + 1 :]:
        if not row or not any(_clean_cell(cell) for cell in row):
            continue

        try:
            candidate = {
                "ticker_symbol": _clean_cell(row[header_map["ticker_symbol"]]),
                "isin": _clean_cell(row[header_map["isin"]]).upper(),
                "quantity": _parse_float(row[header_map["quantity"]]),
                "average_buy_price": _parse_float(
                    row[header_map["average_buy_price"]]
                ),
                "current_market_value": _parse_float(
                    row[header_map["current_market_value"]]
                ),
                "source_page": source_page,
                "extraction_method": "deterministic",
                "confidence": "high",
                "exit_confirmed": False,
            }
            parsed_holdings.append(AssetHolding.model_validate(candidate))
        except (KeyError, IndexError, TypeError, ValueError):
            continue

    return parsed_holdings


def _find_header(
    table: list[list[Any]],
) -> tuple[int | None, dict[str, int]]:
    for row_index, row in enumerate(table):
        normalized_cells = [_normalize_header(cell) for cell in row]
        header_map: dict[str, int] = {}

        for field_name, aliases in FIELD_ALIASES.items():
            for column_index, cell in enumerate(normalized_cells):
                if cell in aliases:
                    header_map[field_name] = column_index
                    break

        if REQUIRED_FIELDS.issubset(header_map):
            return row_index, header_map

    return None, {}


def _extract_pdf_text(file_bytes: bytes) -> str:
    page_text: list[str] = []

    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text.append(page.extract_text() or "")

    return "\n".join(page_text)


def _parse_with_llm(sanitized_text: str, mode: str) -> MasterParsedPayload:
    prompt = _build_prompt(sanitized_text)

    if mode == "cloud":
        response_text = _call_groq(prompt)
    else:
        response_text = _call_ollama(prompt)

    payload = _extract_json_object(response_text)
    normalized_payload = _normalize_payload(payload, extraction_method="llm")

    return MasterParsedPayload.model_validate(normalized_payload)


def _call_groq(prompt: str) -> str:
    from groq import Groq

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama3-8b-8192",
        temperature=0,
    )

    return completion.choices[0].message.content or "{}"


def _call_ollama(prompt: str) -> str:
    payload = json.dumps(
        {
            "model": "llama3",
            "prompt": prompt,
            "stream": False,
        }
    ).encode("utf-8")
    ollama_request = request.Request(
        "http://localhost:11434/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with request.urlopen(ollama_request, timeout=120) as response:
        body = json.loads(response.read().decode("utf-8"))

    return str(body.get("response", "{}"))


def _build_prompt(sanitized_text: str) -> str:
    return f"""
You are parsing an Indian investment statement.
Return ONLY a JSON object matching this exact schema:
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
      "confidence": "high",
      "exit_confirmed": false
    }}
  ],
  "ledger_summary": {{
    "closing_cash_balance": 0.0,
    "cumulative_platform_fees": 0.0
  }}
}}

Rules:
- No conversational text.
- No markdown fences.
- Do not include PII.
- Use confidence "high" only when the row is clear, otherwise "low".
- Use extraction_method "llm" for every holding.

Sanitized statement text:
{sanitized_text}
""".strip()


def _normalize_payload(
    payload: dict[str, Any], extraction_method: Literal["deterministic", "llm"]
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
        confidence = holding.get("confidence")
        if confidence not in {"high", "low"}:
            holding["confidence"] = "low"

    return payload


def _force_extraction_method(
    payload: MasterParsedPayload, extraction_method: Literal["deterministic", "llm"]
) -> MasterParsedPayload:
    for holding in payload.holdings:
        holding.extraction_method = extraction_method
        if holding.confidence not in {"high", "low"}:
            holding.confidence = "low"

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


def _normalize_header(value: Any) -> str:
    return " ".join(_clean_cell(value).lower().replace("_", " ").split())


def _clean_cell(value: Any) -> str:
    return "" if value is None else str(value).strip()


def _parse_float(value: Any) -> float:
    cleaned_value = (
        _clean_cell(value)
        .replace(",", "")
        .replace("₹", "")
        .replace("INR", "")
        .strip()
    )
    if cleaned_value.startswith("(") and cleaned_value.endswith(")"):
        cleaned_value = f"-{cleaned_value[1:-1]}"

    return float(cleaned_value)


def parse_portfolio_payload(payload: MasterParsedPayload) -> MasterParsedPayload:
    return payload
