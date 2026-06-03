# Rapidash

## Setup

1. Start the backend:

```bash
cd rapidash-backend && pip install -r requirements.txt && uvicorn main:app --reload
```

2. Start the frontend:

```bash
cd rapidash-frontend && npm install && npm run dev
```

## Environment Variables

Create a local environment file at the project root:

```bash
GROQ_API_KEY=
```

Use `.env.example` for repo sharing and leave the values empty so contributors can fill in their own local settings.

## Data Files

Place `nse_master.csv` in `rapidash-backend/data/` so backend validation can match holdings against NSE master data.
