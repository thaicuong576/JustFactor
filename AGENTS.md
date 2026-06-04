# AGENTS.md

## Project Role

JustFactor is a digital invoice factoring platform for SMEs in Vietnam. It enables SMEs to register, submit invoices for vetting, and bid out their invoice receivables to Financial Institutions.

## Read First

- `README.md`
- `docs/PROJECT_STATE.md`
- `alternative_data_engine_specs.md`
- `docs/JustFactor_Alternative_Data_Assessment_Engine.md`

`docs/PROJECT_STATE.md` is the canonical local project memory. Read it at the start of every coding session and update it after meaningful implementation, debugging, deployment-prep, or verification work.

Read `docs/JustFactor_Alternative_Data_Assessment_Engine.md` before changing alternative-data scraping, enrichment, scoring, scorecard redaction, or invoice-score integration.

## Stack

- **Backend**: FastAPI, SQLAlchemy async, Alembic, PostgreSQL.
- **Frontend**: React (Vite, TypeScript, TailwindCSS).
- **Storage**: Supabase Storage when configured, local file storage fallback otherwise.
- **LLM Engine**: OpenAI-compatible/Kimi LLM via RamClouds proxy, with deterministic local fallback for alternative data.

## Common Commands

```text
# Backend setup and run:
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend setup and run:
cd frontend
npm install
npm run dev

# Run unit tests:
cd backend
.venv\Scripts\python.exe -m unittest discover -s tests -v
```

## Working Rules

- Keep product source, tests, docs, and deployment config in this repo.
- Keep cross-project coding-agent memory in `D:\eddie-agents\coding-agent-workspace`.
- Treat `docs/PROJECT_STATE.md` as this repo's local memory. Read it before work and update it after meaningful work.
- Prefer existing project patterns over new abstractions.
- Keep changes focused on the current request.
- Verify before claiming completion.

## Verification

Use the closest relevant checks:

```text
cd backend
.venv\Scripts\python.exe -m unittest discover -s tests -v

cd ..\frontend
npm run build
```

## Project State Updates

After meaningful work, update `docs/PROJECT_STATE.md` with:

- current status
- what changed
- what was verified
- known gaps
- next actions

## Boundaries

Do not store secrets, runtime cache, generated media, or unrelated global agent state in this repo.
