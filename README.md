# Rapidash

## Setup

1. Start the backend:

```bash

```cd rapidash-backend && pip install -r requirements.txt && uvicorn main:app --reload

2. Start the frontend:

```bash
npm install && npm run dev
```

## Environment Variables

Create a local environment file at the project root:

```bash
GROQ_API_KEY=
```

Use `.env.example` for repo sharing and leave the values empty so contributors can fill in their own local settings.

## Data Files

Place `nse_master.csv` in `rapidash-backend/data/` so backend validation can match holdings against NSE master data.

## Deployment

### Deploying Backend to Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. New Project → Deploy from GitHub repo
4. Select your `rapidash-backend` repo/folder
5. Railway auto-detects Python and runs:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
6. Add environment variables in Railway dashboard:
   `GROQ_API_KEY=your_key_here`
7. Railway gives you a URL like:
   `https://rapidash-backend-production.up.railway.app`
