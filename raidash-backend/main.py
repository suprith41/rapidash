from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analyze, ingest

# Load .env early so GROQ_API_KEY and other secrets are available to all modules.
load_dotenv(override=False)


app = FastAPI(title="Raidash Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api", tags=["ingest"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["analyze"])


@app.get("/")
def health_check() -> dict[str, str]:
    return {"status": "raidash backend online"}
