from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, delete
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.modules.auth.models import User, UserRole
from app.modules.auth.router import get_current_user
from app.modules.sme import models as sme_models
from app.modules.invoice import models as inv_models
from app.modules.payment import models as pay_models
from app.modules.scoring import models as score_models
from app.modules.trading import models as trade_models
from app.modules.sme import schemas as sme_schemas

router = APIRouter(prefix="/sme", tags=["SME Profile"])

@router.delete("/{user_id}/admin-delete")
async def admin_delete_sme(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only Admin can delete SME profiles")

    result = await db.execute(
        select(User).options(selectinload(User.sme_profile)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user or user.role != UserRole.SME:
        raise HTTPException(status_code=404, detail="SME user not found")

    sme_id = user.sme_profile.id if user.sme_profile else None

    if sme_id:
        # Load all invoices first
        invoices_result = await db.execute(
            select(inv_models.Invoice).where(inv_models.Invoice.sme_id == sme_id)
        )
        invoices = invoices_result.scalars().all()

        for inv in invoices:
            # Delete offers and credit_scores (no ORM cascade on these)
            await db.execute(delete(trade_models.Offer).where(trade_models.Offer.invoice_id == inv.id))
            await db.execute(delete(score_models.CreditScore).where(score_models.CreditScore.invoice_id == inv.id))
            # Delete invoice (cascades invoice_documents via ORM)
            await db.delete(inv)

        await db.flush()

        # Delete bank_accounts (no ORM cascade)
        await db.execute(delete(pay_models.BankAccount).where(pay_models.BankAccount.sme_id == sme_id))

        # Delete SME (cascades alternative_data_assessment via ORM)
        sme = await db.get(sme_models.SME, sme_id)
        if sme:
            await db.delete(sme)

        await db.flush()

    await db.delete(user)
    await db.commit()

    return {"message": f"SME user {user_id} and all related data deleted successfully."}

@router.get("/{sme_id}/full-profile", response_model=sme_schemas.SMEFullProfileDTO)
async def get_sme_full_profile(
    sme_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Check quyền: Chỉ FI hoặc Admin mới được soi hồ sơ SME khác
    if current_user.role not in [UserRole.FI, UserRole.ADMIN]:
        # Nếu là SME, chỉ được xem hồ sơ của chính mình
        if current_user.sme_profile and current_user.sme_profile.id != sme_id:
             raise HTTPException(status_code=403, detail="Not authorized to view this profile")

    # 2. Query SME kèm theo Bank Accounts
    stmt = select(sme_models.SME).options(
        selectinload(sme_models.SME.bank_accounts)
    ).where(sme_models.SME.id == sme_id)
    
    result = await db.execute(stmt)
    sme = result.scalar_one_or_none()
    
    if not sme:
        raise HTTPException(status_code=404, detail="SME not found")

    # 3. Tính toán số liệu tổng hợp (Aggregates)
    # Tổng tiền đã được tài trợ
    q_financed = select(func.sum(inv_models.Invoice.total_amount)).where(
        inv_models.Invoice.sme_id == sme_id,
        inv_models.Invoice.status == inv_models.InvoiceStatus.FINANCED
    )
    total_financed = (await db.execute(q_financed)).scalar() or 0
    
    # Tổng số hóa đơn
    q_count = select(func.count(inv_models.Invoice.id)).where(inv_models.Invoice.sme_id == sme_id)
    total_count = (await db.execute(q_count)).scalar() or 0

    # 4. Lấy 5 hóa đơn gần nhất
    q_recent = select(inv_models.Invoice).where(
        inv_models.Invoice.sme_id == sme_id
    ).order_by(desc(inv_models.Invoice.created_at)).limit(5)
    recent_invoices = (await db.execute(q_recent)).scalars().all()

    # 5. Map sang DTO (Data Transfer Object)
    return {
        "company_name": sme.company_name,
        "tax_code": sme.tax_code,
        "address": sme.address,
        "company_website": sme.company_website,
        "linkedin_url": sme.linkedin_url,
        "legal_rep_name": sme.legal_rep_name, # SQLAlchemy TypeDecorator tự giải mã
        "phone_number": sme.phone_number,
        "created_at": sme.created_at,
        "total_invoices_uploaded": total_count,
        "total_financed_amount": total_financed,
        "bank_accounts": sme.bank_accounts,
        "recent_invoices": recent_invoices
    }
