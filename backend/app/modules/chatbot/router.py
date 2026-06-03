import re

import google.generativeai as genai
import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.modules.invoice.models import Invoice

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


class ChatRequest(BaseModel):
    message: str


LLM_MODE = "disabled"
model = None

if settings.LLM_BASE_URL and settings.LLM_API_KEY and settings.LLM_MODEL:
    LLM_MODE = "openai-compatible"
    print(f"DEBUG: Custom LLM configured for base URL: {settings.LLM_BASE_URL}")
elif settings.GEMINI_API_KEY:
    LLM_MODE = "gemini"
    print(f"DEBUG: Loading Gemini with Key Length: {len(settings.GEMINI_API_KEY)}")
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
    print("DEBUG: Gemini Model initialized (gemini-2.5-flash)")
else:
    print("DEBUG: No LLM provider configured")


def build_chat_completions_url() -> str:
    base_url = settings.LLM_BASE_URL.rstrip("/")
    if not base_url.endswith("/v1"):
        base_url = f"{base_url}/v1"
    return f"{base_url}/chat/completions"


def build_prompt(msg: str, context_info: list[str]) -> str:
    return f"""
    You are a helpful AI Assistant for 'JUSTFACTOR', an Invoice Factoring Platform in Vietnam.
    Your job is to answer user questions about factoring, fees, and invoice status based on the provided context.

    Platform Info:
    - Discount Rate: ~10-15% per year.
    - Platform Fee: 0.5% of value.
    - Process: Upload -> Score -> Trade -> Disburse.

    Context Data:
    {''.join(context_info)}

    User Question: "{msg}"

    Answer politely in Vietnamese. If context data is present, use it to answer flexibly.
    """


def extract_assistant_text(payload: dict) -> str:
    choices = payload.get("choices") or []
    if not choices:
        raise ValueError("No choices returned from LLM provider")

    message = choices[0].get("message") or {}
    content = message.get("content")

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text_parts.append(item.get("text", ""))
        if text_parts:
            return "".join(text_parts)

    raise ValueError("Unsupported LLM response format")


@router.post("/chat")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    msg = request.message.strip()
    print(f"DEBUG: Received message: '{msg}'")

    context_info = []

    match = re.search(r"(inv-[\w\d]+)", msg, re.IGNORECASE)
    if match:
        inv_code = match.group(1).upper()
        result = await db.execute(select(Invoice).where(Invoice.invoice_number == inv_code))
        invoice = result.scalars().first()

        if invoice:
            status_vn = {
                "DRAFT": "Nhap",
                "PROCESSING": "Dang xu ly",
                "VERIFIED": "Da xac thuc",
                "TRADING": "Dang giao dich",
                "FINANCED": "Da tai tro",
                "DISBURSED": "Da giai ngan",
                "REPAYMENT_RECEIVED": "Cho tat toan",
                "CLOSED": "Hoan thanh",
                "REJECTED": "Bi tu choi",
            }.get(invoice.status, invoice.status)

            info = f"""
            [System Data found for {inv_code}]:
            - Status: {status_vn}
            - Amount: {invoice.total_amount:,.0f} VND
            - Buyer: {invoice.buyer_name}
            - Issues Date: {invoice.issue_date}
            """
            context_info.append(info)
        else:
            context_info.append(f"[System Data]: Invoice {inv_code} NOT found in database.")

    prompt = build_prompt(msg, context_info)

    if LLM_MODE == "openai-compatible":
        try:
            print("DEBUG: Calling OpenAI-compatible LLM API...")
            payload = {
                "model": settings.LLM_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are the JUSTFACTOR AI assistant. Be concise, accurate, and answer in Vietnamese.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
                "stream": False,
            }
            headers = {
                "Authorization": f"Bearer {settings.LLM_API_KEY}",
                "Content-Type": "application/json",
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(build_chat_completions_url(), json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()

            print("DEBUG: Custom LLM response received")
            return {"response": extract_assistant_text(data)}
        except Exception as e:
            print(f"DEBUG: Custom LLM Error: {e}")
            return {"response": f"Xin loi, LLM dang gap su co: {str(e)}"}

    if LLM_MODE == "gemini" and model:
        try:
            print("DEBUG: Calling Gemini API...")
            response = model.generate_content(prompt)
            print("DEBUG: Gemini API Response Received")
            return {"response": response.text}
        except Exception as e:
            print(f"DEBUG: Gemini Error: {e}")
            return {"response": f"Xin loi, AI dang gap su co: {str(e)}"}

    print("DEBUG: Fallback (No Model)")
    return {
        "response": "AI chua duoc cau hinh. Vui long kiem tra LLM_BASE_URL, LLM_API_KEY, LLM_MODEL hoac GEMINI_API_KEY."
    }
