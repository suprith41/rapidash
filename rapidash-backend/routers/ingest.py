import io
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile

from core.analyzer import (
    calculate_health_score,
    calculate_rebalancing,
    calculate_sip_plan,
    generate_investment_memo,
)
from core.parser import parse_pdf
from core.validator import validate_holdings
from models.schema import MasterParsedPayload


router = APIRouter()


@router.get("/ingest")
def ingest_status() -> dict[str, str]:
    return {"status": "ingest router ready"}


@router.post("/ingest", response_model=MasterParsedPayload)
async def ingest_pdf(file: UploadFile = File(...)) -> MasterParsedPayload:
    """Parse an uploaded PDF statement and return the normalized portfolio payload."""

    try:
        file_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {exc}") from exc

    try:
        parsed_payload = parse_pdf(file_bytes)
    except ValueError as exc:
        # Validation error from the parser
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        # Surface the real error so the user/developer can diagnose it.
        raise HTTPException(
            status_code=422,
            detail=f"PDF parsing failed: {exc}",
        ) from exc

    if not parsed_payload.holdings:
        raise HTTPException(
            status_code=422,
            detail=(
                "No holdings could be extracted from this PDF. "
                "Use POST /api/debug-pdf to inspect raw extraction results."
            ),
        )

    parsed_payload.holdings = validate_holdings(parsed_payload.holdings)
    parsed_payload.health_score = calculate_health_score(
        parsed_payload.holdings,
        parsed_payload.ledger_summary,
    )
    parsed_payload.rebalancing = calculate_rebalancing(
        parsed_payload.holdings,
        parsed_payload.ledger_summary,
    )
    parsed_payload.sip_plan = calculate_sip_plan(parsed_payload.rebalancing)
    parsed_payload.investment_memo = generate_investment_memo(
        parsed_payload.holdings,
        parsed_payload.ledger_summary,
        parsed_payload.health_score,
        parsed_payload.rebalancing,
        parsed_payload.sip_plan,
    )
    return parsed_payload


@router.post("/debug-pdf")
async def debug_pdf(file: UploadFile = File(...)) -> dict[str, Any]:
    import pdfplumber

    file_bytes = await file.read()
    result: dict[str, Any] = {
        "file_size_bytes": len(file_bytes),
        "page_count": 0,
        "pages": [],
    }

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        result["page_count"] = len(pdf.pages)
        for i, page in enumerate(pdf.pages):
            page_data: dict[str, Any] = {
                "page_number": i + 1,
                "tables_found": 0,
                "raw_table_sample": "",
                "raw_text_sample": "",
            }

            # try tables
            tables = page.extract_tables()
            if tables:
                page_data["tables_found"] = len(tables)
                page_data["raw_table_sample"] = str(tables[0])[:500]

            # try text
            text = page.extract_text()
            if text:
                page_data["raw_text_sample"] = text[:500]

            result["pages"].append(page_data)

    return result
