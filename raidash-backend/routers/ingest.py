from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from core.parser import parse_pdf
from core.validator import validate_holdings
from models.schema import MasterParsedPayload


router = APIRouter()


@router.get("/")
def ingest_status() -> dict[str, str]:
    return {"status": "ingest router ready"}


@router.post("/", response_model=MasterParsedPayload)
async def ingest_pdf(file: UploadFile = File(...), mode: str = Form(...)) -> MasterParsedPayload:
    """Parse an uploaded PDF statement and return the normalized portfolio payload."""

    try:
        file_bytes = await file.read()
        parsed_payload = parse_pdf(file_bytes, mode)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail="PDF parsing failed — unsupported format",
        ) from exc

    parsed_payload.holdings = validate_holdings(parsed_payload.holdings)
    return parsed_payload
