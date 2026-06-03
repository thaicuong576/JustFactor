# JUSTFACTOR

Invoice factoring MVP for SMEs, financial institutions, and admins in Vietnam.

## Stack

- Backend: FastAPI, SQLAlchemy async, Alembic, PostgreSQL
- Frontend: React, Vite, TypeScript, Tailwind
- Storage: Supabase Storage
- Payments: SePay webhook, VietQR QR generation
- AI: OpenAI-compatible provider support and Gemini fallback

## Current Notes

- SePay webhook flow is working with API key auth.
- VietQR QR generation is usable.
- VietQR account lookup may not work on free plans; the backend now degrades safely and saves bank accounts as unverified instead of faking success.
- Local storage fallback is supported when Supabase is not configured.

## Repo Layout

```text
JustFactor/
├── backend/
│   ├── alembic/
│   ├── app/
│   ├── docker-compose.yml
│   ├── pyproject.toml
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env.example
└── README.md
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker Desktop

## Environment Files

Backend template:
- [backend/.env.example](D:/eddie-projects/personal-projects/JustFactor/backend/.env.example:1)

Frontend template:
- [frontend/.env.example](D:/eddie-projects/personal-projects/JustFactor/frontend/.env.example:1)

Create:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

## Backend Setup

### Option A: Poetry

```bash
cd backend
poetry install
docker compose up -d
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Option B: Local venv fallback

Use this if Poetry gives resolver issues on your machine.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -U pip
python -m pip install fastapi "uvicorn[standard]" python-multipart sqlalchemy asyncpg alembic lxml pandas openpyxl "python-jose[cryptography]" "passlib[bcrypt]" cryptography celery redis httpx pydantic-settings psycopg2-binary email-validator argon2-cffi requests fastapi-mail jinja2 supabase google-generativeai greenlet
docker compose up -d
.venv\Scripts\python.exe -m alembic upgrade head
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend URLs:

- API root: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Frontend URL:

- `http://127.0.0.1:5173`

## Required Backend Env Values

Minimum local dev:

```env
DATABASE_URL=postgresql://admin:secret_password@localhost:5432/factoring_core
SECRET_KEY=change-me
```

Recommended integrations:

```env
SUPABASE_URL=
SUPABASE_KEY=

SEPAY_API_URL=https://userapi-sandbox.sepay.vn
SEPAY_ACCESS_TOKEN=
SEPAY_WEBHOOK_KEY=

VIETQR_API_URL=https://api.vietqr.io/v2
VIETQR_CLIENT_ID=
VIETQR_API_KEY=

LLM_BASE_URL=
LLM_API_KEY=
LLM_MODEL=
```

## Test Accounts

These accounts are not created automatically by migrations. Seed them locally if needed.

- Admin: `admin@invoice-platform.com` / `admin_password_sieumanh_123`
- FI: `tpbank@partner.com` / `123456`
- FI: `vinacapital@partner.com` / `123456`

Notes:

- SME users register through the UI.
- New SME registrations start as inactive and must be approved by admin before login.

## Seeding Local Test Accounts

```bash
cd backend
.venv\Scripts\python.exe sp.py
```

The original FI seed script exists too:

```bash
cd backend
.venv\Scripts\python.exe create_fi_data.py
```

## Temporary Public Testing

For local webhook testing, you can expose the backend with Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://127.0.0.1:8000
```

Then use:

```text
https://<random>.trycloudflare.com/api/v1/payment/webhook/sepay
```

## Verification Checklist

- Backend boots without import errors
- Frontend loads login and SME registration screens
- Admin login works
- FI login works
- SePay webhook returns HTTP 200
- SME registration works, then admin approval enables SME login

## Known Gaps

- VietQR account lookup is provider-plan dependent and may return unsupported/free-plan errors.
- Poetry resolution may be inconsistent on some Windows environments.
- A stable domain/tunnel setup is still recommended before any external demo or VPS deployment.
