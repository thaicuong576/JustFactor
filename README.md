# JustFactor

**Invoice Factoring Platform for SMEs in Vietnam**

JustFactor connects SMEs, Financial Institutions (FIs), and Admins in a streamlined invoice factoring workflow — enabling businesses to unlock working capital from outstanding invoices.

---

## Screenshots

### Landing

![Landing](docs/screenshots/01-landing.png)

### Login

![Login](docs/screenshots/02-login-form.png)

### Admin — Dashboard

![Admin Dashboard](docs/screenshots/03-admin-dashboard.png)

![Admin Dashboard (scrolled)](docs/screenshots/04-admin-dashboard-scroll.png)

### Admin — SME List

![Admin SME List](docs/screenshots/05-admin-sme-list.png)

### Admin — Invoices

![Admin Invoices](docs/screenshots/06-admin-invoices.png)

### SME — Dashboard

![SME Dashboard](docs/screenshots/07-sme-dashboard.png)

![SME Dashboard (scrolled)](docs/screenshots/08-sme-dashboard-scroll.png)

### SME — Invoice List

![SME Invoices](docs/screenshots/09-sme-invoices.png)

### SME — Upload Invoice

![SME Upload Modal](docs/screenshots/10-sme-upload-modal.png)

### SME — AI Scoring

![SME Scoring](docs/screenshots/11-sme-scoring.png)

### SME — Offers

![SME Offers](docs/screenshots/12-sme-offers.png)

### FI (TPBank) — Dashboard

![FI TPBank Dashboard](docs/screenshots/13-fi-tpbank-dashboard.png)

![FI TPBank Dashboard (scrolled)](docs/screenshots/14-fi-tpbank-scroll.png)

### FI (TPBank) — Marketplace

![FI Marketplace](docs/screenshots/15-fi-marketplace.png)

### FI (TPBank) — Deals

![FI Deals](docs/screenshots/16-fi-deals.png)

### FI (VinaCaptial) — Dashboard

![FI VinaCaptial Dashboard](docs/screenshots/17-fi-vinacapital-dashboard.png)

![FI VinaCaptial Dashboard (scrolled)](docs/screenshots/18-fi-vinacapital-scroll.png)

### FI (VinaCaptial) — Marketplace

![FI VinaCaptial Marketplace](docs/screenshots/19-fi-vinacapital-marketplace.png)

### SME Registration

![SME Registration](docs/screenshots/20-registration.png)

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
├── docs/
│   └── screenshots/       # App screenshots
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
