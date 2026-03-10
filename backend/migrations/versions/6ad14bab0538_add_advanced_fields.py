"""add_advanced_fields

Revision ID: 6ad14bab0538
Revises:
Create Date: 2026-03-06 05:21:00.572888

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '6ad14bab0538'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add new columns for Phase 5A advanced features"""

    # Create enum type for priority (uppercase values to match SQLModel)
    priority_enum = postgresql.ENUM('LOW', 'MEDIUM', 'HIGH', name='taskpriority', create_type=False)
    priority_enum.create(op.get_bind(), checkfirst=True)

    # Add new columns
    op.add_column('task', sa.Column('priority', priority_enum, nullable=False, server_default='MEDIUM'))
    op.add_column('task', sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'))
    op.add_column('task', sa.Column('due_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('task', sa.Column('remind_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('task', sa.Column('recurring_pattern', sa.String(length=100), nullable=True))
    op.add_column('task', sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('task', sa.Column('parent_task_id', sa.Integer(), nullable=True))
    op.add_column('task', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))

    # Add foreign key constraint for parent_task_id
    op.create_foreign_key(
        'fk_task_parent_task_id',
        'task', 'task',
        ['parent_task_id'], ['id'],
        ondelete='SET NULL'
    )

    # Create full-text search index
    op.execute("""
        CREATE INDEX idx_task_search ON task
        USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')))
    """)

    # Add constraint: remind_at must be before due_date
    op.create_check_constraint(
        'chk_remind_before_due',
        'task',
        'remind_at IS NULL OR due_date IS NULL OR remind_at < due_date'
    )


def downgrade() -> None:
    """Remove Phase 5A columns and revert to original schema"""

    # Drop constraint
    op.drop_constraint('chk_remind_before_due', 'task', type_='check')

    # Drop indexes
    op.drop_index('idx_task_search', 'task')

    # Drop foreign key
    op.drop_constraint('fk_task_parent_task_id', 'task', type_='foreignkey')

    # Drop columns
    op.drop_column('task', 'completed_at')
    op.drop_column('task', 'parent_task_id')
    op.drop_column('task', 'is_recurring')
    op.drop_column('task', 'recurring_pattern')
    op.drop_column('task', 'remind_at')
    op.drop_column('task', 'due_date')
    op.drop_column('task', 'tags')
    op.drop_column('task', 'priority')

    # Drop enum type
    priority_enum = postgresql.ENUM('LOW', 'MEDIUM', 'HIGH', name='taskpriority')
    priority_enum.drop(op.get_bind(), checkfirst=True)
