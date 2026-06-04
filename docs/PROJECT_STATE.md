# Project State

## Snapshot

Last updated:

2026-06-04

Current phase:

MVP

Current build mode:

Level 1 Fast Build

Status:

Alternative Data Scoring is integrated into SME registration, admin/FI/SME scorecard views, and invoice credit scoring. The project is being prepared for disposable VPS deployment via the `deploy/school-temp/` Docker workspace template while local debugging continues against PostgreSQL.

## Product

Purpose:

SME Invoice Factoring Platform in Vietnam that uses Alternative Data (Web & LinkedIn digital presence) to assess legitimacy, operational activity, and risk for fast financing decisions.

Primary users:

- SMEs looking to factor invoices.
- FIs (Financial Institutions) bidding on and funding invoice packages.
- Admins verifying credentials and executing credit scoring.

Core workflow:

SME registers -> provides website/LinkedIn -> alternative data scoring engine calculates digital footprint metrics -> admin approves user -> SME uploads invoice package -> invoice is parsed/vetted/scored -> marketplace auction -> FI bids -> SME accepts bid -> funding and repayment workflow.

## What Works

- SME & FI registration and authentication.
- SME registration captures company website and LinkedIn URL.
- Alternative Data assessment records are created after SME registration and can be recalculated from the Admin API.
- Mira-style enrichment exists for company identity, business profile, digital legitimacy, LinkedIn footprint, operating activity, reputation risk, and source quality.
- First-party company careers/jobs pages are used as recruitment evidence when third-party job boards or DuckDuckGo are blocked.
- Kimi/OpenAI-compatible LLM evaluation works when configured, with local deterministic fallback when APIs fail or are missing.
- Alternative Data scorecards are shown in SME, Admin, and FI contexts with raw evidence redacted for non-admin roles.
- Invoice credit scoring uses completed alternative data scores instead of the old fixed SME-history score, with neutral fallback while assessment is unavailable.
- SME invoice upload parses common Vietnamese e-invoice totals including alternate tags and formatted values, then verifies and scores invoices.
- Docker-based VPS handoff template exists under `deploy/school-temp/` for `/opt/nops-labs/school-temp`.

## Known Gaps

- Highly variable response latency from the Ollama/Kimi upstream proxy, sometimes requiring fallback or long timeouts (up to 90 seconds).
- Frontend still contains mojibake in several older/non-redesign components; active redesign paths are being fixed as issues appear.
- Local Windows currently has a stale/phantom listener on `127.0.0.1:8000`; current local test setup uses backend `8002` and frontend `5173`.
- `.hermes/` and `.obsidian/` were removed locally; `.gitignore` still protects them if external tools regenerate those folders.
- Docker Compose v2 warns that `version: "3.8"` is obsolete locally, but the VPS brief uses Docker Compose 1.29, so the version key is intentionally kept in the handoff template.
- The active test suite is focused; there is still no full browser automation test for the complete SME registration -> admin approval -> invoice upload -> FI marketplace path.

## Recent Work

### 2026-06-04 - Move Alternative Data Engine Spec Into Docs

Changed:

- Moved `JustFactor_Alternative_Data_Assessment_Engine.md` from the repo root into `docs/`.
- Updated `AGENTS.md` so future coding sessions read the Alternative Data Engine spec before touching scraping, scoring, scorecard redaction, or invoice-score integration.
- Updated project memory to reflect that `.hermes/` and `.obsidian/` were removed locally and should stay out of source control if regenerated.

Verified:

- Confirmed `docs/JustFactor_Alternative_Data_Assessment_Engine.md` exists.
- Confirmed `AGENTS.md` and this project state file point to the moved document.

### 2026-06-04 - Add First-Party Careers Fallback for Alternative Data

Changed:

- Added first-party recruitment fallback in `backend/app/modules/alternative_data/services.py`.
- The scraper now detects company-owned careers/jobs links such as `/careers`, `/jobs`, `/tuyen-dung`, `/viec-lam`, `/hiring`, and `/join-us`.
- `run_scraping_sync` now prepends first-party careers evidence to recruitment snippets so the LLM can still score hiring activity when TopCV, VietnamWorks, CareerViet, LinkedIn Jobs, or DuckDuckGo are blocked.
- Updated the LLM recruitment rubric to prefer first-party company careers pages over third-party job boards.
- Added a regression test proving recruitment snippets are produced from first-party careers pages when third-party job-board search is empty.

Verified:

- `.venv\Scripts\python.exe -m py_compile app\modules\alternative_data\services.py`
- `.venv\Scripts\python.exe -m unittest discover -s tests -v` (7 tests pass)
- `npm run build` in `frontend` (passes; existing Browserslist and chunk-size warnings remain)

### 2026-06-04 - Prepare Disposable VPS Workspace Template

Changed:

- Added `deploy/school-temp/` as a self-contained handoff template for `/opt/nops-labs/school-temp`.
- Added Docker Compose services for `backend`, `frontend`, `db` (Postgres 16), and `redis`.
- Added separate Dockerfiles for backend and frontend because the repo does not currently ship production Dockerfiles.
- Added setup and teardown scripts so the VPS workspace can be started with `./scripts/setup.sh` and fully removed with `./scripts/teardown.sh`.
- Added `.dockerignore` to keep Docker build context small and avoid shipping local caches, node modules, artifacts, and secrets.
- Regenerated `backend/poetry.lock` to match the current `pyproject.toml` after adding Scrapling.

Verified:

- `docker compose config` against the school-temp template
- `docker build -t justfactor-school-frontend-dryrun -f deploy/school-temp/Dockerfile.frontend .`
- `docker build --no-cache -t justfactor-school-backend-dryrun -f deploy/school-temp/Dockerfile.backend .`
- `poetry check --lock`
- `.venv\Scripts\python.exe -m unittest discover -s tests -v` (7 tests pass)

Notes:

- Local Docker Compose v2 warns that `version` is obsolete, but the template keeps `version: "3.8"` for compatibility with the VPS brief's Docker Compose 1.29.
- Before public VPS testing, set `VITE_API_URL=http://<VPS_IP_OR_DOMAIN>:8000/api/v1` and replace placeholder secrets in `/opt/nops-labs/school-temp/.env`.

### 2026-06-04 - Fix SME Invoice Upload Diagnostics

Changed:

- Fixed invoice upload validation so `HTTPException` responses such as invalid XML amount remain 400 responses instead of being wrapped into 500 errors.
- Expanded `InvoiceParser` total amount extraction to support alternate e-invoice tags such as `TgTToan`, `TgTCThue`, `TgTThue`, and formatted values like `1,234,567`.
- Updated the redesigned invoice upload form to display backend `detail` messages from Axios responses.
- Added parser regression coverage for alternate total tags and formatted amounts.

Verified:

- Multipart upload against local backend returned `201 Created` with `total_amount=1234567.0`.
- `.venv\Scripts\python.exe -m unittest discover -s tests -v` (8 tests pass)
- `npm run build` in `frontend` (passes; existing Browserslist and chunk-size warnings remain)

### 2026-06-03 - Exclude Tax Registry, Optimize LLM Prompts & Fix Chatbot

Changed:

- Deleted DuckDuckGo `_verify_tax_code` lookup method in `backend/app/modules/alternative_data/services.py` to focus purely on alternative digital footprints.
- Redesigned LLM system and user prompt to be brace-free (without curly braces `{}`) to prevent 400 Bad Request template compilation errors on the RamClouds proxy.
- Increased client HTTP request timeout to 90 seconds to allow Kimi to complete deep HTML crawl content evaluation.
- Fixed Chatbot API (`backend/app/modules/chatbot/router.py`) payload by removing `system` role/`temperature` parameter for proxy compatibility, and wrapped print messages to prevent Windows `UnicodeEncodeError` crashes when handling Vietnamese characters.
- Restarted backend server process on port 8000 to apply the new codebase.

Verified:

- `python -m unittest tests/test_alternative_data.py` (Passes)
- Triggered SME 1 (UDD Labs) and SME 2 (GFI Group) recalculations via custom scripts, verifying that Kimi successfully outputs structured evaluations in Vietnamese for active domains, and falls back correctly when empty or invalid.
- Verified chatbot API returns 200 OK with accurate Vietnamese answers without crashing standard output encoding.

Notes:

- Upstream proxy throws 400 Bad Request if curly braces are used in LLM payload messages.
- Stale running uvicorn process (PID 7784) was killed and restarted to reload modified code.

## Next Actions

- Push the current branch/repo state so the VPS agent can clone it into `/opt/nops-labs/school-temp/repo`.
- On VPS, copy `repo/deploy/school-temp/*` into `/opt/nops-labs/school-temp`, create `.env`, set `VITE_API_URL`, and run `./scripts/setup.sh`.
- Smoke-test on VPS: admin login, SME pending approval list, SME invoice upload, alternative data recalculation, and FI deal detail scorecard.
- Normalize remaining mojibake in active UI screens before demo.
- Add broader mocked tests for the LLM/Scrapling assessment task and a browser-level upload flow test when time allows.

## Verification Commands

```text
cd backend
.venv\Scripts\python.exe -m unittest discover -s tests -v
.venv\Scripts\python.exe -m alembic upgrade head

cd ..\frontend
npm run build

cd ..
docker compose -f deploy/school-temp/docker-compose.yml config
docker build -t justfactor-school-frontend-dryrun -f deploy/school-temp/Dockerfile.frontend .
docker build -t justfactor-school-backend-dryrun -f deploy/school-temp/Dockerfile.backend .
```

## Important Docs

- `README.md`
- `AGENTS.md`
- `alternative_data_engine_specs.md`
- `docs/JustFactor_Alternative_Data_Assessment_Engine.md`
- `deploy/school-temp/README.md`

## Handoff Notes

The Alternative Data Engine is operational with LLM and deterministic fallback paths. If the LLM API fails or times out, local rule-based evaluation keeps a valid scorecard in the database. Preserve brace-free LLM prompts for RamClouds compatibility.

Local test services as of the last session:

- Frontend: `http://127.0.0.1:5173`
- Backend debug server: `http://localhost:8002/api/v1`
- PostgreSQL: Docker container on `localhost:5432`

Port `8000` may be held by a stale Windows listener locally; do not assume it is the current backend unless verified with `/docs`.
