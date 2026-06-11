# JustFactor

**Invoice Factoring Platform for SMEs in Vietnam**

JustFactor connects SMEs, Financial Institutions (FIs), and Admins in a streamlined invoice factoring workflow — enabling businesses to unlock working capital from outstanding invoices.

---

## Application Flows & Screenshots

The platform is divided into three distinct portals tailored to each user role, each utilizing a specific color theme:
* 🟩 **SME Portal (JustFactor Cashflow - Xanh lục)**: SME registration, document uploading, and contract signing.
* 🟨 **FI Portal (JustFactor Capital - Vàng)**: Bidding on invoices, viewing risk profiles, and checking alternative data.
* ⬛ **Admin Portal (JustFactor Ops - Xám)**: Platform operations, KYC approval, invoice auditing, and transaction monitoring.

---

### 🟩 1. SME Flow (Luồng SME - Xanh lục)
The SME portal (**JustFactor Cashflow**) allows businesses to submit KYC, upload invoices, and sign funding agreements.

* **[SME] - Đăng nhập (sme-login.png)**: Login page with the green theme for SME Cashflow.
  ![SME Login](docs/screenshots/sme-login.png)
* **[SME] - Đăng ký tài khoản & KYC (sme-kyc-registration.png)**: SME registration (Step 1/2) for uploading KYC documents (Business License, Front & Back ID, Portrait).
  ![SME KYC Registration](docs/screenshots/sme-kyc-registration.png)
* **[SME] - Hồ sơ doanh nghiệp (sme-profile.png)**: SME Profile for company **BYE BÉO** (MST: `6001715097`, Legal Rep: `PHAN BẢO LONG`, Address: `566 Lê Duẩn, Buôn Ma Thuột, Đắk Lắk`). Displays verified KYC status and digital presence checking.
  ![SME Profile](docs/screenshots/sme-profile.png)
* **[SME] - Bảng điều khiển & Chấm điểm Alternative Data (sme-dashboard.png)**: SME main dashboard showing an approved funding limit of **10.000.000.000 đ** and an AI-driven **Alternative Data** score (`103/200` score, `5.15/10` fit). Displays Digital Presence (`3.5/3.5`), Recruitment Signal (`1.25/2.5`), and Public Visibility (`0.4/4` reflecting negative reputation hits).
  ![SME Dashboard](docs/screenshots/sme-dashboard.png)
* **[SME] - Tải lên bộ hồ sơ hóa đơn (sme-invoice-upload.png)**: SME uploads a complete invoice document package including XML e-invoice, PDF invoice, commercial contract, and delivery notes.
  ![SME Upload Modal](docs/screenshots/sme-invoice-upload.png)
* **[SME] - Ký hợp đồng bao thanh toán (sme-contract-signing.png)**: SME reviews and signs the factoring contract (#JF-0000604) for `22.000 đ` with the funder `CONG TY CO PHAN VIEON`.
  ![SME Contract Signing](docs/screenshots/sme-contract-signing.png)

---

### 🟨 2. FI Flow (Luồng FI - Vàng)
The FI portal (**JustFactor Capital**) allows Financial Institutions (like TPBank and VinaCapital) to view available invoices, check risk metrics, and submit bids.

* **[FI] - Đăng nhập (fi-login.png)**: B2B portal login with the gold/yellow theme.
  ![FI Login](docs/screenshots/fi-login.png)
* **[FI] - Sàn giao dịch hóa đơn (fi-marketplace.png)**: FI's trading floor showing active invoices ready for funding (e.g., Invoice #0000604 at `22.000 đ` (Grade A) and #0000426 at `275.000.000 đ` (Grade C)).
  ![FI Marketplace](docs/screenshots/fi-marketplace.png)
* **[FI] - Phòng giao dịch - Đánh giá rủi ro (fi-traderoom-overview.png)**: FI inspects the deal's credit score (`903` / Grade A, PD `0.0%`) alongside detailed alternative data signals.
  ![FI Trading Room Overview](docs/screenshots/fi-traderoom-overview.png)
* **[FI] - Phòng giao dịch - Ra giá tài trợ (fi-traderoom-bidding.png)**: FI inputs a discount rate (e.g., `12%/year`) and submits a funding offer. Displays expected interest, platform fees, and net disbursement (`21.780 đ`).
  ![FI Bidding](docs/screenshots/fi-traderoom-bidding.png)
* **[FI] - Cổng thanh toán trung gian & Chuyển tiền tài trợ (fi-intermediary-payment.png)**: Intermediary VietinBank payment gateway for disburse and collection operations (masked bank account and QR code for safety).
  ![FI Intermediary Payment](docs/screenshots/fi-intermediary-payment.png)

---

### ⬛ 3. Admin Flow (Luồng Admin - Xám)
The Admin portal (**JustFactor Ops**) acts as the central control room for platform verification, auditing, and ledger matching.

* **[Admin] - Đăng nhập (admin-login.png)**: Operational backend login with the dark gray theme.
  ![Admin Login](docs/screenshots/admin-login.png)
* **[Admin] - Bảng vận hành trung tâm (admin-ops-dashboard.png)**: System overview displaying total Funded GMV (**22.000 đ**), platform fees (**220 đ**), active SMEs (2), active FIs (2), and approved businesses.
  ![Admin Dashboard](docs/screenshots/admin-ops-dashboard.png)
* **[Admin] - Kiểm toán và Phê duyệt hóa đơn (admin-invoice-audit.png)**: Admins review invoices and confirm funding statuses (e.g. confirming FI payment for invoice #0000604 to trigger disbursement).
  ![Admin Invoice Audit](docs/screenshots/admin-invoice-audit.png)
* **[Admin] - Giám sát giao dịch ngân hàng (admin-transaction-monitoring.png)**: Real-time logs of bank transfers via SePay, tracking cash-in (simulated funding) and cash-out (disbursement to SME) transactions.
  ![Admin Transaction Monitoring](docs/screenshots/admin-transaction-monitoring.png)

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
