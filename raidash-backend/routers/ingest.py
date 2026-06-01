from fastapi import APIRouter


router = APIRouter()


@router.get("/")
def ingest_status() -> dict[str, str]:
    return {"status": "ingest router ready"}
