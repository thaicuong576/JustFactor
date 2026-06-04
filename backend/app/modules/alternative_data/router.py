from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, AsyncSessionLocal
from app.modules.alternative_data import models as alt_models
from app.modules.alternative_data.schemas import AlternativeDataScorecardResponse
from app.modules.alternative_data.services import (
    AlternativeDataAssessmentService,
    build_public_scorecard,
    run_alternative_data_assessment_task,
    validate_result_schema,
)
from app.modules.auth.models import User, UserRole
from app.modules.auth.router import get_current_user

router = APIRouter(prefix="/alternative-data", tags=["Alternative Data"])


async def _get_assessment_or_404(sme_id: int, db: AsyncSession) -> alt_models.AlternativeDataAssessment:
    result = await db.execute(
        select(alt_models.AlternativeDataAssessment).where(
            alt_models.AlternativeDataAssessment.sme_id == sme_id
        )
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Alternative data assessment not found")
    return assessment


def _can_view_sme(current_user: User, sme_id: int) -> bool:
    if current_user.role in [UserRole.ADMIN, UserRole.FI]:
        return True
    return bool(current_user.sme_profile and current_user.sme_profile.id == sme_id)


@router.get("/sme/{sme_id}", response_model=AlternativeDataScorecardResponse)
async def get_sme_alternative_data(
    sme_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _can_view_sme(current_user, sme_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    assessment = await _get_assessment_or_404(sme_id, db)
    return build_public_scorecard(assessment, current_user.role)


@router.post("/sme/{sme_id}/recalculate", response_model=AlternativeDataScorecardResponse)
async def recalculate_sme_alternative_data(
    sme_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only Admin can recalculate alternative data")

    service = AlternativeDataAssessmentService(db)
    assessment = await service.get_or_create(sme_id)
    assessment.status = alt_models.AlternativeDataStatus.PROCESSING
    assessment.error_message = None
    await db.commit()
    await db.refresh(assessment)

    background_tasks.add_task(run_alternative_data_assessment_task, sme_id)
    return build_public_scorecard(assessment, current_user.role)


@router.post("/webhook/result")
async def receive_hermes_result(request: Request):
    """
    Legacy webhook endpoint (Hermes migrated to in-process scraping).
    """
    return {"status": "ignored", "message": "Pipeline migrated to in-process scraping."}

