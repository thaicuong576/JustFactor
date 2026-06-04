# JUSTFACTOR

Invoice factoring MVP for SMEs, financial institutions, and admins in Vietnam.

## Stack

- **Backend:** FastAPI, SQLAlchemy async, Alembic, PostgreSQL
- **Frontend:** React, Vite, TypeScript, Tailwind
- **Storage:** Supabase Storage
- **Payments:** SePay webhook, VietQR QR generation
- **AI:** OpenAI-compatible provider support, Gemini & MiniMax fallback

## Repo Layout

```text
JustFactor/
├── backend/
│   ├── alembic/           # DB migrations
│   ├── app/               # FastAPI app (modules: auth, invoice, payment, scoring, etc.)
│   ├── tests/
│   ├── sp.py              # Admin seed script
│   ├── create_fi_data.py  # FI test accounts seed script
│   ├── pyproject.toml
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env.example
├── deploy/
│   └── school-temp/       # Docker Compose deployment template for disposable VPS workspaces
└── README.md
```

---

## Quick Deploy on a Fresh VPS (Disposable Workspace)

This is the recommended method for demos and short-lived testing (2–3 days). Everything runs in Docker.

### 1. Clone & scaffold

```bash
git clone https://github.com/thaicuong576/JustFactor /opt/nops-labs/school-temp-2
cd /opt/nops-labs/school-temp-2
mkdir -p scripts data/db data/uploads
cp repo/deploy/school-temp/docker-compose.yml .
cp repo/deploy/school-temp/Dockerfile.backend .
cp repo/deploy/school-temp/Dockerfile.frontend .
cp repo/deploy/school-temp/.env.example .env
cp repo/deploy/school-temp/scripts/*.sh scripts/
chmod +x scripts/*.sh
```

### 2. Configure secrets

Edit `.env` — at minimum set `SECRET_KEY`, `DATABASE_URL`, and `VITE_API_URL` to your VPS public IP.

```bash
vim .env
```

### 3. Start everything

```bash
./scripts/setup.sh
```

### 4. Seed test accounts (first-time only)

```bash
docker exec school-temp-2_backend_1 bash -c "cd /app/backend && python sp.py && python create_fi_data.py"
```

### 5. Access the app

| Service | URL |
|---------|-----|
| **Frontend** | `http://<VPS_IP>:5173` |
| **Backend API** | `http://<VPS_IP>:8003/docs` |

### 6. Destroy everything (after demo)

```bash
./scripts/teardown.sh
```

---

## Local Development (Without Docker)

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 16+
- Redis 7+

### Environment Files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Backend Setup (Poetry)

```bash
cd backend
poetry install
# Start PostgreSQL & Redis manually, then:
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## Required Backend Env Values

**Minimum local dev:**
```env
DATABASE_URL=postgresql://admin:secret_password@localhost:5432/factoring_core
SECRET_KEY=change-me
```

**Optional integrations:**
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
GEMINI_API_KEY=
MINIMAX_BASE_URL=https://api.minimax.io
MINIMAX_API_KEY=
MINIMAX_MODEL=MiniMax-M2.7
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=dev@example.com
MAIL_PORT=587
MAIL_SERVER=localhost
```

---

## Test Accounts

These are not created by migrations. Seed them after deployment (see step 4 above).

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@invoice-platform.com` | `admin_password_sieumanh_123` |
| **FI (Conservative)** | `tpbank@partner.com` | `123456` |
| **FI (Aggressive)** | `vinacapital@partner.com` | `123456` |

> SME users register through the UI. New SME registrations start as **inactive** and must be approved by admin before login.

---

## Verification Checklist

- [x] Backend boots without import errors
- [x] Frontend loads login and SME registration screens
- [ ] Admin login works
- [ ] FI login works
- [ ] SePay webhook returns HTTP 200
- [ ] SME registration works, then admin approval enables SME login

---

## Current Notes

- SePay webhook flow is working with API key auth.
- VietQR QR generation is usable.
- VietQR account lookup may not work on free plans; the backend degrades safely and saves bank accounts as unverified instead of faking success.
- Local storage fallback is supported when Supabase is not configured.
- `fd964678fbe0` (rejection_reason migration) was a no-op in the original commit — the column is now properly added in the deployed version.

## Known Gaps

- VietQR account lookup is provider-plan dependent and may return unsupported/free-plan errors.
- Poetry resolution may be inconsistent on some Windows environments.
- A stable domain/Caddy reverse proxy setup is recommended for production demos.
