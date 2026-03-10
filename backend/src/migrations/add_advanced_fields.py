"""
Add advanced task fields for Phase 5A

Revision ID: add_advanced_fields
Revises:
Create Date: 2026-03-05 21:39:30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_advanced_fields'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add new columns for Phase 5A advanced features"""

    # Create enum type for priority
    priority_enum = postgresql.ENUM('low', 'medium', 'high', name='taskpriority')
    priority_enum.create(op.get_bind(), checkfirst=True)

    # Add new columns
    op.add_column('task', sa.Column('priority', priority_enum, nullable=False, server_default='medium'))
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

    # Create indexes
    op.create_index('idx_task_priority', 'task', ['priority'])
    op.create_index('idx_task_tags', 'task', ['tags'], postgresql_using='gin')
    op.create_index('idx_task_due_date', 'task', ['due_date'], postgresql_where=sa.text('due_date IS NOT NULL'))
    op.create_index('idx_task_parent', 'task', ['parent_task_id'], postgresql_where=sa.text('parent_task_id IS NOT NULL'))

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
    op.drop_index('idx_task_parent', 'task')
    op.drop_index('idx_task_due_date', 'task')
    op.drop_index('idx_task_tags', 'task')
    op.drop_index('idx_task_priority', 'task')

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
    priority_enum = postgresql.ENUM('low', 'medium', 'high', name='taskpriority')
    priority_enum.drop(op.get_bind(), checkfirst=True)
