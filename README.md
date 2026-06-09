# JustFactor

**Invoice Factoring Platform for SMEs in Vietnam**

JustFactor is an MVP that connects SMEs, Financial Institutions (FIs), and Admins in a streamlined invoice factoring workflow — enabling businesses to unlock working capital from outstanding invoices.

---

## Screenshots

### Landing & Login

![Login Page](../screenshots/02-login.png)

### Admin Dashboard

![Admin Dashboard](../screenshots/04-admin-dashboard.png)

### FI (Financial Institution) Dashboard

![FI Dashboard](../screenshots/06-fi-dashboard.png)

### SME Registration

![SME Registration](../screenshots/08-registration.png)

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI, SQLAlchemy async, Alembic, PostgreSQL |
| **Frontend** | React, Vite, TypeScript, Tailwind CSS |
| **Storage** | Supabase Storage (local fallback supported) |
| **Payments** | SePay webhook, VietQR QR generation |
| **AI / Scoring** | OpenAI-compatible, Gemini & MiniMax fallback |
| **Infrastructure** | Docker Compose, Redis |

---

## Features

- **SME Portal** — Upload invoices, track factoring status, receive offers
- **FI Marketplace** — Browse available invoices, make offers, manage deals
- **Admin Panel** — Approve/reject SME registrations, monitor platform activity
- **AI-powered Scoring** — Alternative data assessment engine for credit risk
- **Payment Integration** — SePay webhook + VietQR for Vietnamese payment rails
- **Chat Assistant** — Built-in AI chatbot per role

---

## User Roles

| Role | Description |
|------|-------------|
| **Admin** | Approves SME accounts, monitors the platform |
| **FI** | Financial institutions that purchase invoices |
| **SME** | Small businesses that sell invoices for early cash |

---

## Quick Deploy on a Fresh VPS

Everything runs in Docker. Recommended for demos and short-lived testing (2–3 days).

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
| **Backend API Docs** | `http://<VPS_IP>:8003/docs` |

### 6. Tear down (after demo)

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

### Backend (Poetry)

```bash
cd backend
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## Environment Variables

**Minimum for local dev:**

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

Seed these after deployment (step 4 above). SME users register through the UI and require admin approval before they can log in.

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@invoice-platform.com` | `admin_password_sieumanh_123` |
| **FI (Conservative)** | `tpbank@partner.com` | `123456` |
| **FI (Aggressive)** | `vinacapital@partner.com` | `123456` |

---

## Repo Layout

```
JustFactor/
├── backend/
│   ├── alembic/           # DB migrations
│   ├── app/               # FastAPI app (auth, invoice, payment, scoring, …)
│   ├── tests/
│   ├── sp.py              # Admin seed script
│   ├── create_fi_data.py  # FI test accounts seed script
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   └── package.json
├── deploy/
│   └── school-temp/       # Docker Compose deployment template
└── README.md
```

---

## Notes

- SePay webhook flow works with API key auth.
- VietQR QR generation is functional; account lookup may fail on free-tier plans (backend degrades gracefully).
- Local storage fallback is active when Supabase is not configured.
- A Caddy reverse proxy is recommended for stable domain-based production demos.
