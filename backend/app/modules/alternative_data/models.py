from datetime import datetime
import enum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class AlternativeDataStatus(str, enum.Enum):
    PENDING = "PENDING"
    PENDING_CONFIG = "PENDING_CONFIG"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class AlternativeDataAssessment(Base):
    __tablename__ = "alternative_data_assessments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sme_id: Mapped[int] = mapped_column(ForeignKey("smes.id"), unique=True, nullable=False, index=True)
    status: Mapped[AlternativeDataStatus] = mapped_column(
        Enum(AlternativeDataStatus),
        default=AlternativeDataStatus.PENDING,
        nullable=False,
        index=True,
    )
    alternative_data_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    fit_score: Mapped[float] = mapped_column(default=0.0, nullable=False)
    confidence_avg: Mapped[float] = mapped_column(default=0.0, nullable=False)
    scorecard: Mapped[dict] = mapped_column(JSONB, nullable=True, server_default="{}")
    enriched_data: Mapped[dict] = mapped_column(JSONB, nullable=True, server_default="{}")
    raw_evidence: Mapped[dict] = mapped_column(JSONB, nullable=True, server_default="{}")
    sources: Mapped[list] = mapped_column(JSONB, nullable=True, server_default="[]")
    public_summary: Mapped[str] = mapped_column(String, nullable=True)
    error_message: Mapped[str] = mapped_column(String, nullable=True)
    last_run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    sme = relationship("SME", back_populates="alternative_data_assessment")
