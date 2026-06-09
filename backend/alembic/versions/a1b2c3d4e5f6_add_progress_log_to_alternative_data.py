"""Add progress_log to alternative_data_assessments

Revision ID: a1b2c3d4e5f6
Revises: fd964678fbe0
Create Date: 2026-06-05 02:22:54

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = ('fd964678fbe0', '9b1e8c4a2d7f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'alternative_data_assessments',
        sa.Column('progress_log', JSONB, nullable=True, server_default='[]')
    )


def downgrade() -> None:
    op.drop_column('alternative_data_assessments', 'progress_log')
