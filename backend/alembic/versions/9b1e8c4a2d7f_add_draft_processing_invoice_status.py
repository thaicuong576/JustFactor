"""add draft processing invoice status

Revision ID: 9b1e8c4a2d7f
Revises: 7c3f2a91d4b6
Create Date: 2026-06-04 11:20:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "9b1e8c4a2d7f"
down_revision: Union[str, Sequence[str], None] = "7c3f2a91d4b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE invoicestatus ADD VALUE IF NOT EXISTS 'DRAFT'")
    op.execute("ALTER TYPE invoicestatus ADD VALUE IF NOT EXISTS 'PROCESSING'")


def downgrade() -> None:
    # PostgreSQL does not support dropping enum values directly.
    pass
