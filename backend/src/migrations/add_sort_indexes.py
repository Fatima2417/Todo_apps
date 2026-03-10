"""Add indexes for sort fields

Revision ID: add_sort_indexes
Revises: add_advanced_fields
Create Date: 2026-03-06 00:11:25.633000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_sort_indexes'
down_revision = 'add_advanced_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create indexes for commonly sorted fields to improve query performance
    # created_at already has an index from the original schema

    # Index for due_date sorting (nulls last is handled in query)
    op.create_index('idx_task_due_date', 'task', ['due_date'], unique=False)

    # Index for priority sorting
    op.create_index('idx_task_priority', 'task', ['priority'], unique=False)

    # Index for title sorting (case-insensitive)
    op.execute('CREATE INDEX idx_task_title_lower ON task (LOWER(title))')

    # Index for completed_at sorting
    op.create_index('idx_task_completed_at', 'task', ['completed_at'], unique=False)

    # Composite index for common filter + sort combinations
    op.create_index('idx_task_user_completed_created', 'task', ['user_id', 'completed', 'created_at'], unique=False)


def downgrade() -> None:
    # Drop all indexes created in upgrade
    op.drop_index('idx_task_user_completed_created', table_name='task')
    op.drop_index('idx_task_completed_at', table_name='task')
    op.execute('DROP INDEX IF EXISTS idx_task_title_lower')
    op.drop_index('idx_task_priority', table_name='task')
    op.drop_index('idx_task_due_date', table_name='task')
