from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
import json
from typing import Optional
from jose import JWTError, jwt

from app.core.config import settings
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

# In-memory log queues: sme_id -> list of asyncio.Queue (one per SSE subscriber)
_log_subscribers: dict[int, list[asyncio.Queue]] = {}


def push_log(sme_id: int, message: str) -> None:
    """Push a log line to all active SSE subscribers for this sme_id."""
    for q in _log_subscribers.get(sme_id, []):
        try:
            q.put_nowait(message)
        except asyncio.QueueFull:
            pass


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


@router.get("/sme/{sme_id}/stream")
async def stream_assessment_logs(
    sme_id: int,
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """SSE endpoint — replays persisted logs then streams live updates."""
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Load persisted logs from DB
    result = await db.execute(
        select(alt_models.AlternativeDataAssessment).where(
            alt_models.AlternativeDataAssessment.sme_id == sme_id
        )
    )
    assessment = result.scalar_one_or_none()
    persisted_logs: list[str] = []
    already_done = False
    if assessment:
        persisted_logs = assessment.progress_log or []
        already_done = assessment.status in (
            alt_models.AlternativeDataStatus.COMPLETED,
            alt_models.AlternativeDataStatus.FAILED,
        ) and "__DONE__" in persisted_logs

    async def event_generator():
        # 1. Replay persisted logs first
        for msg in persisted_logs:
            if msg == "__DONE__":
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return
            yield f"data: {json.dumps({'type': 'log', 'message': msg})}\n\n"

        # 2. If already done (no __DONE__ in persisted but status=COMPLETED), close
        if already_done:
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        # 3. Subscribe to live queue for ongoing task
        q: asyncio.Queue = asyncio.Queue(maxsize=200)
        _log_subscribers.setdefault(sme_id, []).append(q)
        try:
            while True:
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=300)
                    if msg == "__DONE__":
                        yield f"data: {json.dumps({'type': 'done'})}\n\n"
                        break
                    yield f"data: {json.dumps({'type': 'log', 'message': msg})}\n\n"
                except asyncio.TimeoutError:
                    yield f"data: {json.dumps({'type': 'ping'})}\n\n"
        finally:
            subs = _log_subscribers.get(sme_id, [])
            if q in subs:
                subs.remove(q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

