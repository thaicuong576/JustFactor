"""Add qr_image_path to bank_accounts

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-05 05:51:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'bank_accounts',
        sa.Column('qr_image_path', sa.String(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('bank_accounts', 'qr_image_path')
