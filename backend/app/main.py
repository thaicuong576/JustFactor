import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.core.config import settings

# Import models in dependency-safe order so SQLAlchemy relationships register.
from app.modules.payment import models as payment_models
from app.modules.scoring import models as scoring_models
from app.modules.trading import models as trading_models
from app.modules.invoice import models as invoice_models
from app.modules.fi import models as fi_models
from app.modules.sme import models as sme_models
from app.modules.auth import models as auth_models

from app.modules.auth.router import router as auth_router
from app.modules.invoice.router import router as invoice_router
from app.modules.scoring.router import router as scoring_router
from app.modules.trading.router import router as trading_router
from app.modules.sme.router import router as sme_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.payment.router import router as payment_router
from app.modules.fi.router import router as fi_router
from app.modules.chatbot.router import router as chatbot_router

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])

origins = [
    "https://factoring1.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("storage/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="storage/uploads"), name="static")

app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(invoice_router, prefix=settings.API_V1_STR)
app.include_router(scoring_router, prefix=settings.API_V1_STR)
app.include_router(trading_router, prefix=settings.API_V1_STR)
app.include_router(sme_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(payment_router, prefix=settings.API_V1_STR)
app.include_router(fi_router, prefix=settings.API_V1_STR)
app.include_router(chatbot_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "Factoring Platform MVP is running!"}
