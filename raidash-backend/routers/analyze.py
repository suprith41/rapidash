from fastapi import APIRouter


router = APIRouter()


@router.get("/")
def analyze_status() -> dict[str, str]:
    return {"status": "analyze router ready"}
