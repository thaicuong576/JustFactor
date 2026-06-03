from datetime import datetime
import re

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.modules.auth.models import User, UserRole
from app.modules.auth.router import get_current_user
from app.modules.invoice import models as inv_models
from app.modules.payment import models as pay_models
from app.modules.payment import schemas as pay_schemas
from app.modules.payment.services import VietQRService
from app.modules.trading import models as trade_models

router = APIRouter(prefix="/payment", tags=["Payment"])


class AddBankAccountRequest(BaseModel):
    bank_code: str
    bank_name: str
    account_number: str


@router.post("/bank-accounts")
async def add_bank_account(
    payload: AddBankAccountRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.SME:
        raise HTTPException(status_code=403, detail="Only SME can add bank accounts")

    vietqr = VietQRService()
    res = await vietqr.lookup_account(payload.bank_code, payload.account_number)

    account_holder_name = "UNVERIFIED"
    is_verified = False
    verification_note = None

    if res["success"]:
        account_holder_name = res["account_name"]
        is_verified = True
        print(f"Found account holder: {account_holder_name}")
    else:
        verification_note = res["message"]
        print(f"Bank account could not be verified: {verification_note}")

    new_acc = pay_models.BankAccount(
        sme_id=current_user.sme_profile.id,
        bank_code=payload.bank_code,
        bank_name=payload.bank_name,
        account_number=payload.account_number,
        account_holder=account_holder_name,
        is_verified=is_verified,
        is_primary=True,
    )

    db.add(new_acc)
    await db.commit()
    await db.refresh(new_acc)

    return {
        "id": new_acc.id,
        "sme_id": new_acc.sme_id,
        "bank_code": new_acc.bank_code,
        "bank_name": new_acc.bank_name,
        "account_number": new_acc.account_number,
        "account_holder": new_acc.account_holder,
        "is_verified": new_acc.is_verified,
        "is_primary": new_acc.is_primary,
        "created_at": new_acc.created_at,
        "verification_note": verification_note,
    }


@router.post("/webhook/sepay")
async def sepay_webhook(
    payload: pay_schemas.SePayWebhookPayload,
    db: AsyncSession = Depends(get_db),
    authorization: str = Header(None),
):
    expected_key = f"Apikey {settings.SEPAY_WEBHOOK_KEY}"
    if authorization != expected_key:
        raise HTTPException(status_code=401, detail="Invalid Webhook Key")

    stmt = select(pay_models.BankTransaction).where(pay_models.BankTransaction.sepay_id == payload.id)
    existing_tx = await db.execute(stmt)
    if existing_tx.scalar_one_or_none():
        return {"success": True, "message": "Transaction already processed"}

    new_tx = pay_models.BankTransaction(
        sepay_id=payload.id,
        gateway=payload.gateway,
        transaction_date=payload.transactionDate,
        account_number=payload.accountNumber,
        sub_account=payload.subAccount,
        transfer_type=payload.transferType,
        transfer_amount=payload.transferAmount,
        code=payload.code,
        content=payload.content,
        raw_data=payload.model_dump(mode="json"),
    )
    db.add(new_tx)

    search_text = (payload.code or "") + (payload.content or "")
    match = re.search(r"INV[- ]?(\d+)", search_text.upper())

    if match:
        invoice_id = int(match.group(1))

        stmt = select(inv_models.Invoice).options(selectinload(inv_models.Invoice.offers)).where(inv_models.Invoice.id == invoice_id)
        res = await db.execute(stmt)
        invoice = res.scalar_one_or_none()

        if invoice:
            accepted_offer = next((o for o in invoice.offers if o.status == trade_models.OfferStatus.ACCEPTED), None)
            amount_in = float(payload.transferAmount)

            if payload.transferType == "in" and accepted_offer:
                if invoice.status == inv_models.InvoiceStatus.FINANCED and abs(amount_in - accepted_offer.fi_disbursement_amount) < 50000:
                    invoice.status = inv_models.InvoiceStatus.FUNDING_RECEIVED
                    print(f"Invoice #{invoice_id}: FI Funding Received ({amount_in})")
                elif invoice.status == inv_models.InvoiceStatus.DISBURSED and abs(amount_in - float(invoice.total_amount)) < 50000:
                    invoice.status = inv_models.InvoiceStatus.REPAYMENT_RECEIVED
                    print(f"Invoice #{invoice_id}: Debtor Repayment Received ({amount_in})")
            elif payload.transferType == "out":
                pending_tx_stmt = select(pay_models.BankTransaction).where(
                    pay_models.BankTransaction.status == "PENDING",
                    pay_models.BankTransaction.transfer_type == "out",
                    pay_models.BankTransaction.related_invoice_id == invoice_id,
                )
                pending_tx_res = await db.execute(pending_tx_stmt)
                pending_tx = pending_tx_res.scalar_one_or_none()

                if pending_tx and abs(amount_in - float(pending_tx.transfer_amount)) < 50000:
                    pending_tx.status = "SUCCESS"
                    pending_tx.sepay_id = payload.id

                    if invoice.status == inv_models.InvoiceStatus.FUNDING_RECEIVED:
                        invoice.status = inv_models.InvoiceStatus.DISBURSED
                        print(f"Invoice #{invoice_id}: Disbursement Successful")
                    elif invoice.status == inv_models.InvoiceStatus.REPAYMENT_RECEIVED:
                        invoice.status = inv_models.InvoiceStatus.CLOSED
                        print(f"Invoice #{invoice_id}: Deal Closed")

    await db.commit()
    return {"success": True}


@router.post("/simulate/fi-fund/{invoice_id}")
async def simulate_fi_fund(invoice_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(inv_models.Invoice).options(
        selectinload(inv_models.Invoice.offers).selectinload(trade_models.Offer.fi)
    ).where(inv_models.Invoice.id == invoice_id)

    res = await db.execute(stmt)
    invoice = res.scalar_one_or_none()

    if not invoice or invoice.status != inv_models.InvoiceStatus.FINANCED:
        raise HTTPException(status_code=400, detail="Invoice not ready for funding")

    accepted_offer = next((o for o in invoice.offers if o.status == trade_models.OfferStatus.ACCEPTED), None)
    if not accepted_offer:
        raise HTTPException(status_code=404, detail="No accepted offer found for this invoice")

    fi_entity = accepted_offer.fi
    transfer_amount = float(accepted_offer.fi_disbursement_amount or accepted_offer.funding_amount)

    if float(fi_entity.balance) < transfer_amount:
        raise HTTPException(status_code=400, detail=f"Insufficient FI Balance. Required: {transfer_amount:,.0f}, Available: {fi_entity.balance:,.0f}")

    fi_entity.balance = float(fi_entity.balance) - transfer_amount
    invoice.status = inv_models.InvoiceStatus.FUNDING_RECEIVED

    new_tx = pay_models.BankTransaction(
        sepay_id=None,
        gateway="SIMULATOR",
        transaction_date=datetime.now(),
        account_number="PLATFORM_INTERMEDIARY",
        sub_account=None,
        transfer_type="in",
        transfer_amount=transfer_amount,
        code=f"INV-{invoice.id}",
        content=f"SIMULATED FUNDING {invoice.invoice_number}",
        status="SUCCESS",
        related_invoice_id=invoice.id,
        raw_data={"simulated": True, "fi_id": fi_entity.id},
    )
    db.add(new_tx)

    await db.commit()
    return {
        "status": "FUNDING_RECEIVED",
        "message": f"Successfully transferred {transfer_amount:,.0f} VND. FI Balance remaining: {fi_entity.balance:,.0f} VND",
    }


@router.post("/simulate/platform-disburse/{invoice_id}")
async def simulate_platform_to_sme(invoice_id: int, db: AsyncSession = Depends(get_db)):
    invoice = await db.get(inv_models.Invoice, invoice_id)
    if not invoice or invoice.status != inv_models.InvoiceStatus.FUNDING_RECEIVED:
        raise HTTPException(status_code=400, detail="Funds not received yet")

    invoice.status = inv_models.InvoiceStatus.DISBURSED
    await db.commit()
    return {"status": "DISBURSED", "message": "Funds transferred to SME"}


@router.post("/simulate/debtor-pay/{invoice_id}")
async def simulate_debtor_pay(invoice_id: int, db: AsyncSession = Depends(get_db)):
    invoice = await db.get(inv_models.Invoice, invoice_id)
    if not invoice or invoice.status != inv_models.InvoiceStatus.DISBURSED:
        raise HTTPException(status_code=400, detail="Invoice not disbursed yet")

    invoice.status = inv_models.InvoiceStatus.REPAYMENT_RECEIVED
    await db.commit()
    return {"status": "REPAYMENT_RECEIVED", "message": "Debtor repayment received"}


@router.post("/simulate/platform-remit/{invoice_id}")
async def simulate_platform_remit(invoice_id: int, db: AsyncSession = Depends(get_db)):
    invoice = await db.get(inv_models.Invoice, invoice_id)
    if not invoice or invoice.status != inv_models.InvoiceStatus.REPAYMENT_RECEIVED:
        raise HTTPException(status_code=400, detail="Repayment not received yet")

    invoice.status = inv_models.InvoiceStatus.CLOSED
    await db.commit()
    return {"status": "CLOSED", "message": "Funds remitted to FI. Deal Closed."}


@router.post("/disburse/{invoice_id}")
async def confirm_disbursement(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.FI:
        raise HTTPException(status_code=403, detail="Only FI can confirm disbursement")

    invoice = await db.get(inv_models.Invoice, invoice_id)
    if not invoice or invoice.status != inv_models.InvoiceStatus.FINANCED:
        raise HTTPException(status_code=400, detail="Invoice is not in a state to be disbursed")

    invoice.status = inv_models.InvoiceStatus.FINANCED
    await db.commit()

    return {"message": "Disbursement confirmed successfully!"}


@router.get("/admin/transactions")
async def get_transaction_logs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    stmt = select(pay_models.BankTransaction).order_by(pay_models.BankTransaction.transaction_date.desc()).limit(100)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/admin/disburse/{invoice_id}")
async def admin_approve_disbursement(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only Admin can approve disbursement")

    stmt = select(inv_models.Invoice).options(selectinload(inv_models.Invoice.offers)).where(inv_models.Invoice.id == invoice_id)
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()

    if not invoice or invoice.status != inv_models.InvoiceStatus.FUNDING_RECEIVED:
        raise HTTPException(status_code=400, detail="Invoice not ready for disbursement (Funds not received yet)")

    accepted_offer = next((o for o in invoice.offers if o.status == trade_models.OfferStatus.ACCEPTED), None)
    if not accepted_offer:
        raise HTTPException(status_code=400, detail="No accepted offer found")

    pending_check = await db.execute(select(pay_models.BankTransaction).where(
        pay_models.BankTransaction.related_invoice_id == invoice_id,
        pay_models.BankTransaction.status == "PENDING",
        pay_models.BankTransaction.transfer_type == "out",
    ))
    existing_pending_tx = pending_check.scalar_one_or_none()

    if existing_pending_tx:
        return {
            "message": "Disbursement already approved. Use existing details.",
            "amount": float(existing_pending_tx.transfer_amount),
            "content": existing_pending_tx.content,
            "status": "PENDING",
        }

    amount_to_sme = accepted_offer.net_amount_to_sme
    transfer_content = f"DISBURSE INV-{invoice.id}"

    pending_tx = pay_models.BankTransaction(
        transfer_type="out",
        transfer_amount=amount_to_sme,
        content=transfer_content,
        code=f"INV-{invoice.id}",
        related_invoice_id=invoice.id,
        status="PENDING",
        gateway="MBBank",
        account_number="SME_ACCOUNT",
        transaction_date=datetime.now(),
        sepay_id=None,
    )

    db.add(pending_tx)
    await db.commit()

    return {
        "message": "Disbursement Approved. Please transfer funds now.",
        "amount": amount_to_sme,
        "content": transfer_content,
        "status": "PENDING",
    }


@router.post("/admin/confirm-funding/{invoice_id}")
async def admin_confirm_fi_funding(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only Admin can confirm funding")

    invoice = await db.get(inv_models.Invoice, invoice_id)
    if not invoice or invoice.status != inv_models.InvoiceStatus.FINANCED:
        raise HTTPException(status_code=400, detail="Invoice not in FINANCED state")

    invoice.status = inv_models.InvoiceStatus.FUNDING_RECEIVED
    await db.commit()

    return {"message": "Funding Confirmed. Invoice ready for disbursement."}
