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

### 2026-06-04 - MiniMax 2.7 Fallback Setup

Changed:

- Added `MINIMAX_BASE_URL`, `MINIMAX_API_KEY`, and `MINIMAX_MODEL` to `Settings` in [config.py](file:///D:/eddie-projects/personal-projects/JustFactor/backend/app/core/config.py) and [.env](file:///D:/eddie-projects/personal-projects/JustFactor/backend/.env).
- Configured MiniMax API fallback mechanism in [services.py](file:///D:/eddie-projects/personal-projects/JustFactor/backend/app/modules/alternative_data/services.py) (functions `evaluate_with_llm` and `_analyze_with_llm`) to seamlessly handle LLM requests if Kimi or the proxy returns a `429 Too Many Requests` or timeout error, including stripping `<think>...</think>` tags to prevent JSON parsing crashes.
- Integrated the MiniMax fallback in the Chatbot API router [router.py](file:///D:/eddie-projects/personal-projects/JustFactor/backend/app/modules/chatbot/router.py) to prevent UI chatbot failure when the main proxy reaches its rate limits, automatically cleaning out reasoning tags from the generated response.
- Restarted the uvicorn debug server on port 8002 to load the updated environment variables.

Verified:

- Ran backend unit tests with `.venv\Scripts\python.exe -m unittest discover -s tests -v`, and all 8 tests passed successfully.
- Confirmed debug server is active and listening at port 8002.

### 2026-06-04 - Visual Color Accents and FI Gold Theme Fixes

Changed:

- Replaced hardcoded `indigo` styles with the correct `bg-amber-600` and `hover:bg-amber-700` styling in [login-form-redesign.tsx](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/features/auth/login-form-redesign.tsx) tabs and button for the FI role.
- Made the login sidebar badge text color dynamic (`theme.badgeTextColorClass`) and added role-specific active border accents (`border-teal-400`, `border-amber-400`, `border-slate-400`) to the switcher cards in [App.tsx](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/App.tsx).
- Refactored [product-shell.tsx](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/components/product-shell.tsx)'s light `BrandMark` component to dynamically determine the background color based on the selected role, preventing the logo from reverting to teal.
- Removed all residual teal accents in [fi-redesign.tsx](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/features/trading/fi-redesign.tsx) (invoices cards gradient, credit score badges, buttons, item list hover borders).
- Overhauled [deal-detail-drawer-redesign.tsx](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/features/trading/deal-detail-drawer-redesign.tsx) and [payment-kit-redesign.tsx](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/features/trading/components/payment-kit-redesign.tsx) to implement amber/gold highlights for risk metrics, container cards, loading indicators, and action buttons.
- Updated [AlternativeDataScorecard.tsx](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/components/AlternativeDataScorecard.tsx) to use dynamic text, border, and badge styling based on the active role theme, and added customizable indicator colors support to [progress.tsx](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/components/ui/progress.tsx).
- Boosted radial gradients opacities in [index.css](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/index.css) to make the color difference in workspace backgrounds distinct.
- Overhauled the "Hồ sơ công ty" settings view in [sme-dashboard-redesign.tsx](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/features/dashboard/sme-dashboard-redesign.tsx) to display full registered profile data (Name, Tax Code, Address, Legal Representative, Contact Phone, Website, LinkedIn) and viewable cards for the 4 uploaded KYC documents.

Verified:

- Checked compiling output via Vite production build (`npm run build`), which completes without errors.
- Verified backend unittests still pass cleanly (`8 tests passed`).

### 2026-06-04 - Unified Role Layout & Theme Identity

Changed:

- Created [role-theme.ts](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/lib/role-theme.ts) exposing theme configurations and `RoleThemeContext` for the three workspaces: SME (`sme`, teal/emerald), FI (`fi`, amber/gold), and Admin (`admin`, graphite/slate).
- Refactored [product-shell.tsx](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/components/product-shell.tsx)'s components `ProductShell`, `BrandMark`, `PageHeader`, and `MetricCard` to automatically inherit theme settings (sidebar background, active button color, text accents, and custom card tones) from context.
- Added custom gradient sidebar classes (`.jf-sidebar-sme`, `.jf-sidebar-fi` with a warm gold radial glow, `.jf-sidebar-admin`) in [index.css](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/index.css).
- Passed corresponding `roleTheme` props to SME Dashboard, FI layout, and Admin Layout components, and refined navigation items labels to match their workflow terms.
- Added an interactive **Role Switcher** on the login page ([LoginFormRedesign](file:///D:/eddie-projects/personal-projects/JustFactor/frontend/src/features/auth/login-form-redesign.tsx)) with dynamic left-sidebar gradients/descriptions (teal/emerald, midnight navy/gold, and graphite/vermilion) and automatic credential prefilling for demo accounts.
- Refactored dashboard headers to show personalized welcomes (e.g. dynamic company names for SMEs) without using emojis for a professional look.

Verified:

- Checked compiling output via Vite production build (`npm run build`), which completes without errors.
- Verified backend unittests still pass cleanly (`8 tests passed`).

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
