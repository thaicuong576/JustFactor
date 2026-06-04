from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class AlternativeDataScorecardResponse(BaseModel):
    status: str
    alternative_data_score: int = 0
    fit_score: float = 0.0
    confidence_avg: float = 0.0
    scorecard: dict[str, Any] = {}
    sources: list[str] = []
    public_summary: Optional[str] = None
    error_message: Optional[str] = None
    last_run_at: Optional[datetime] = None
    raw_evidence: Optional[dict[str, Any]] = None
