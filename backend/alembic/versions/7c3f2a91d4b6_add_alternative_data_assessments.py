"""add_alternative_data_assessments

Revision ID: 7c3f2a91d4b6
Revises: 2d2037fa59cb
Create Date: 2026-06-03 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "7c3f2a91d4b6"
down_revision: Union[str, Sequence[str], None] = "2d2037fa59cb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


alternative_data_status = postgresql.ENUM(
    "PENDING",
    "PENDING_CONFIG",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    name="alternativedatastatus",
    create_type=False,
)


def upgrade() -> None:
    alternative_data_status.create(op.get_bind(), checkfirst=True)
    op.add_column("smes", sa.Column("company_website", sa.String(), nullable=True))
    op.add_column("smes", sa.Column("linkedin_url", sa.String(), nullable=True))
    op.create_table(
        "alternative_data_assessments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sme_id", sa.Integer(), nullable=False),
        sa.Column("status", alternative_data_status, nullable=False),
        sa.Column("alternative_data_score", sa.Integer(), nullable=False),
        sa.Column("fit_score", sa.Float(), nullable=False),
        sa.Column("confidence_avg", sa.Float(), nullable=False),
        sa.Column("scorecard", postgresql.JSONB(astext_type=sa.Text()), server_default="{}", nullable=True),
        sa.Column("enriched_data", postgresql.JSONB(astext_type=sa.Text()), server_default="{}", nullable=True),
        sa.Column("raw_evidence", postgresql.JSONB(astext_type=sa.Text()), server_default="{}", nullable=True),
        sa.Column("sources", postgresql.JSONB(astext_type=sa.Text()), server_default="[]", nullable=True),
        sa.Column("public_summary", sa.String(), nullable=True),
        sa.Column("error_message", sa.String(), nullable=True),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["sme_id"], ["smes.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sme_id"),
    )
    op.create_index(
        op.f("ix_alternative_data_assessments_id"),
        "alternative_data_assessments",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_alternative_data_assessments_sme_id"),
        "alternative_data_assessments",
        ["sme_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_alternative_data_assessments_status"),
        "alternative_data_assessments",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_alternative_data_assessments_status"), table_name="alternative_data_assessments")
    op.drop_index(op.f("ix_alternative_data_assessments_sme_id"), table_name="alternative_data_assessments")
    op.drop_index(op.f("ix_alternative_data_assessments_id"), table_name="alternative_data_assessments")
    op.drop_table("alternative_data_assessments")
    op.drop_column("smes", "linkedin_url")
    op.drop_column("smes", "company_website")
    alternative_data_status.drop(op.get_bind(), checkfirst=True)
