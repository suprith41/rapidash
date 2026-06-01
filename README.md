# Raidash

## Setup

1. Start the backend:

```bash
cd raidash-backend && pip install -r requirements.txt && uvicorn main:app --reload
```

2. Start the frontend:

```bash
cd raidash-frontend && npm install && npm run dev
```

## Environment Variables

Create a local environment file at the project root:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Use `.env.example` for repo sharing and leave the values empty so contributors can fill in their own local settings.

## Privacy Modes

- `cloud`: sends PDF ingestion to the backend using the cloud LLM path.
- `local`: keeps ingestion local and uses the local Ollama path.

## Data Files

Place `nse_master.csv` in `raidash-backend/data/` so backend validation can match holdings against NSE master data.
