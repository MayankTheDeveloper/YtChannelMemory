"""add_content_gaps_and_requested_topics_to_audience_insight

Revision ID: 0e307dc16803
Revises: 7a0c0b1b979e
Create Date: 2026-06-06 13:20:26.599891

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0e307dc16803'
down_revision: Union[str, Sequence[str], None] = '7a0c0b1b979e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('audience_insights', sa.Column('requested_topics', sa.JSON(), nullable=True))
    op.add_column('audience_insights', sa.Column('content_gaps', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('audience_insights', 'content_gaps')
    op.drop_column('audience_insights', 'requested_topics')

