# Data Model: Phase 5A - Advanced Features

**Feature**: 005-advanced-features
**Date**: 2026-03-05
**Phase**: 1 - Data Model Design

## Overview

This document defines the data model extensions for advanced task management features. All entities use SQLModel for type safety and consistency across the stack.

## Entity Definitions

### 1. Task (Extended)

**Purpose**: Core task entity extended with priority, tags, due dates, reminders, and recurring patterns.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | int | Primary Key, Auto-increment | Unique task identifier |
| user_id | int | Foreign Key (users.id), NOT NULL, Indexed | Task owner (multi-tenancy isolation) |
| title | str | NOT NULL, Max 200 chars | Task title |
| description | str | Nullable, Max 2000 chars | Task description |
| is_completed | bool | NOT NULL, Default False | Completion status |
| created_at | datetime | NOT NULL, Default UTC now | Creation timestamp |
| updated_at | datetime | NOT NULL, Default UTC now, Auto-update | Last update timestamp |
| completed_at | datetime | Nullable | Completion timestamp |
| **priority** | TaskPriority (Enum) | NOT NULL, Default MEDIUM | Priority level (NEW) |
| **tags** | List[str] | NOT NULL, Default [], PostgreSQL ARRAY | Task tags (NEW) |
| **due_date** | datetime | Nullable, Indexed | Due date with time (NEW) |
| **remind_at** | datetime | Nullable | Reminder time (NEW) |
| **recurring_pattern** | str | Nullable, Max 100 chars | Recurrence pattern or cron (NEW) |
| **is_recurring** | bool | NOT NULL, Default False | Is this a recurring task? (NEW) |
| **parent_task_id** | int | Nullable, Foreign Key (task.id) | Original task for recurring chain (NEW) |

**Relationships**:
- `user`: Many-to-One with User entity (existing)
- `parent_task`: Self-referential Many-to-One (new recurring tasks link to original)
- `child_tasks`: One-to-Many (original task can have multiple generated occurrences)

**Indexes**:
```sql
CREATE INDEX idx_task_user_id ON task(user_id);  -- Existing
CREATE INDEX idx_task_priority ON task(priority);  -- NEW
CREATE INDEX idx_task_tags ON task USING GIN(tags);  -- NEW
CREATE INDEX idx_task_due_date ON task(due_date) WHERE due_date IS NOT NULL;  -- NEW
CREATE INDEX idx_task_search ON task USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));  -- NEW
CREATE INDEX idx_task_parent ON task(parent_task_id) WHERE parent_task_id IS NOT NULL;  -- NEW
```

**Validation Rules**:
- `priority` must be one of: low, medium, high
- `tags` array max 20 elements, each tag max 50 chars
- `due_date` must be in the future (on creation)
- `remind_at` must be before `due_date` if both set
- `recurring_pattern` must match: "daily", "weekly", "monthly", or valid cron expression
- `parent_task_id` must reference existing task owned by same user

**State Transitions**:
```
[Created] --complete--> [Completed]
[Completed] --uncomplete--> [Created]
[Completed + is_recurring] --auto--> [New Task Created with next due_date]
```

**SQLModel Definition**:
```python
from sqlmodel import Field, SQLModel, Relationship, Column
from sqlalchemy import ARRAY, String, Enum as SQLEnum
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    is_completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)

    # NEW FIELDS
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, sa_column=Column(SQLEnum(TaskPriority)))
    tags: List[str] = Field(default_factory=list, sa_column=Column(ARRAY(String)))
    due_date: Optional[datetime] = Field(default=None)
    remind_at: Optional[datetime] = Field(default=None)
    recurring_pattern: Optional[str] = Field(default=None, max_length=100)
    is_recurring: bool = Field(default=False)
    parent_task_id: Optional[int] = Field(default=None, foreign_key="task.id")

    # Relationships
    user: Optional["User"] = Relationship(back_populates="tasks")
    parent_task: Optional["Task"] = Relationship(
        sa_relationship_kwargs={"remote_side": "Task.id"}
    )
```

### 2. TaskEvent (Event Payload)

**Purpose**: Standardized event structure for Kafka topics. Not stored in database (ephemeral).

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| event_id | str (UUID) | NOT NULL, Unique | Unique event identifier |
| event_type | str | NOT NULL | Event type (e.g., task.created.v1) |
| event_version | str | NOT NULL, Default "v1" | Schema version |
| timestamp | datetime | NOT NULL | Event creation time (UTC) |
| user_id | int | NOT NULL | User who triggered event |
| task_id | int | NOT NULL | Task affected by event |
| data | dict | NOT NULL | Event-specific payload |

**Event Types**:
- `task.created.v1`: New task created
- `task.updated.v1`: Task modified
- `task.deleted.v1`: Task deleted
- `task.completed.v1`: Task marked complete
- `task.uncompleted.v1`: Task marked incomplete
- `task.recurring.completed.v1`: Recurring task completed (triggers new task creation)
- `reminder.due.v1`: Reminder time reached

**Pydantic Model**:
```python
from pydantic import BaseModel, Field
from typing import Dict, Any
from datetime import datetime
import uuid

class TaskEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    event_version: str = "v1"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: int
    task_id: int
    data: Dict[str, Any]

    class Config:
        json_schema_extra = {
            "example": {
                "event_id": "550e8400-e29b-41d4-a716-446655440000",
                "event_type": "task.created.v1",
                "event_version": "v1",
                "timestamp": "2026-03-05T21:00:00Z",
                "user_id": 123,
                "task_id": 456,
                "data": {
                    "title": "Finish report",
                    "priority": "high",
                    "tags": ["work", "deadline"],
                    "due_date": "2026-03-10T15:00:00Z"
                }
            }
        }
```

### 3. ReminderJob (Dapr Jobs State)

**Purpose**: Tracks scheduled reminders via Dapr Jobs API. Managed by Dapr, not directly in database.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| job_id | str | Primary Key | Dapr job identifier |
| task_id | int | NOT NULL | Task to remind about |
| user_id | int | NOT NULL | User to notify |
| scheduled_time | datetime | NOT NULL | When to trigger reminder |
| status | ReminderStatus | NOT NULL | Job status |
| created_at | datetime | NOT NULL | Job creation time |

**ReminderStatus Enum**:
- `pending`: Scheduled, not yet triggered
- `triggered`: Reminder sent
- `snoozed`: User snoozed, rescheduled
- `dismissed`: User dismissed, cancelled
- `cancelled`: Task completed/deleted before reminder

**Note**: This is conceptual - Dapr Jobs manages state internally. Application tracks status via events.

## Data Relationships

```
User (existing)
  │
  └─── has many ──> Task (extended)
                      │
                      ├─── has one (optional) ──> Task (parent_task)
                      │
                      └─── has many (optional) ──> Task (child_tasks)

Task ──publishes──> TaskEvent ──to──> Kafka Topics
  │
  └─── schedules ──> ReminderJob (via Dapr Jobs API)
```

## Database Migration

**Migration Name**: `add_advanced_task_fields`

**Up Migration**:
```sql
-- Add new columns
ALTER TABLE task ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'medium';
ALTER TABLE task ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE task ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE task ADD COLUMN remind_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE task ADD COLUMN recurring_pattern VARCHAR(100);
ALTER TABLE task ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE task ADD COLUMN parent_task_id INTEGER REFERENCES task(id) ON DELETE SET NULL;

-- Create enum type
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
ALTER TABLE task ALTER COLUMN priority TYPE task_priority USING priority::task_priority;

-- Create indexes
CREATE INDEX idx_task_priority ON task(priority);
CREATE INDEX idx_task_tags ON task USING GIN(tags);
CREATE INDEX idx_task_due_date ON task(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_task_search ON task USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_task_parent ON task(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- Add constraints
ALTER TABLE task ADD CONSTRAINT chk_remind_before_due
  CHECK (remind_at IS NULL OR due_date IS NULL OR remind_at < due_date);
```

**Down Migration**:
```sql
-- Drop indexes
DROP INDEX IF EXISTS idx_task_priority;
DROP INDEX IF EXISTS idx_task_tags;
DROP INDEX IF EXISTS idx_task_due_date;
DROP INDEX IF EXISTS idx_task_search;
DROP INDEX IF EXISTS idx_task_parent;

-- Drop constraints
ALTER TABLE task DROP CONSTRAINT IF EXISTS chk_remind_before_due;

-- Drop columns
ALTER TABLE task DROP COLUMN IF EXISTS parent_task_id;
ALTER TABLE task DROP COLUMN IF EXISTS is_recurring;
ALTER TABLE task DROP COLUMN IF EXISTS recurring_pattern;
ALTER TABLE task DROP COLUMN IF EXISTS remind_at;
ALTER TABLE task DROP COLUMN IF EXISTS due_date;
ALTER TABLE task DROP COLUMN IF EXISTS tags;
ALTER TABLE task DROP COLUMN IF EXISTS priority;

-- Drop enum type
DROP TYPE IF EXISTS task_priority;
```

## API Request/Response Schemas

### TaskCreate (Extended)

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    priority: TaskPriority = TaskPriority.MEDIUM
    tags: List[str] = Field(default_factory=list, max_items=20)
    due_date: Optional[datetime] = None
    remind_at: Optional[datetime] = None
    recurring_pattern: Optional[str] = Field(None, max_length=100)

    @validator('tags')
    def validate_tags(cls, v):
        if len(v) > 20:
            raise ValueError('Maximum 20 tags allowed')
        for tag in v:
            if len(tag) > 50:
                raise ValueError('Tag length must be <= 50 characters')
        return v

    @validator('remind_at')
    def validate_reminder(cls, v, values):
        if v and 'due_date' in values and values['due_date']:
            if v >= values['due_date']:
                raise ValueError('Reminder must be before due date')
        return v

    @validator('recurring_pattern')
    def validate_recurrence(cls, v):
        if v:
            valid_patterns = ['daily', 'weekly', 'monthly']
            if v not in valid_patterns and not is_valid_cron(v):
                raise ValueError('Invalid recurring pattern')
        return v
```

### TaskResponse (Extended)

```python
class TaskResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    is_completed: bool
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    priority: TaskPriority
    tags: List[str]
    due_date: Optional[datetime]
    remind_at: Optional[datetime]
    recurring_pattern: Optional[str]
    is_recurring: bool
    parent_task_id: Optional[int]

    class Config:
        from_attributes = True
```

### TaskFilter (Query Parameters)

```python
class TaskFilter(BaseModel):
    q: Optional[str] = None  # Search query
    status: Optional[str] = None  # all, pending, completed
    priority: Optional[TaskPriority] = None
    tags: Optional[List[str]] = None
    due_date_from: Optional[datetime] = None
    due_date_to: Optional[datetime] = None
    sort_by: Optional[str] = "created_at"  # created_at, due_date, priority, title
    sort_order: Optional[str] = "desc"  # asc, desc
    page: int = 1
    page_size: int = 50
```

## Data Validation Rules Summary

1. **Priority**: Must be low, medium, or high
2. **Tags**: Max 20 tags, each max 50 chars, no duplicates
3. **Due Date**: Must be in future (on creation), can be past (for overdue)
4. **Reminder**: Must be before due date if both set
5. **Recurring Pattern**: Must be "daily", "weekly", "monthly", or valid cron
6. **Parent Task**: Must exist and belong to same user
7. **Search Query**: Max 200 chars
8. **Page Size**: Min 1, max 100

## Performance Considerations

### Query Patterns

**Most Common Queries**:
1. Get user's tasks with filters (90% of queries)
2. Search tasks by keyword (5% of queries)
3. Get overdue tasks (3% of queries)
4. Get recurring tasks (2% of queries)

**Optimization Strategy**:
- Index on user_id + priority for filtered lists
- GIN index on tags for tag filtering
- Full-text search index for keyword search
- Partial index on due_date for overdue queries
- Pagination to limit result sets

### Estimated Storage

**Per Task**:
- Base fields: ~200 bytes
- New fields: ~150 bytes
- Total: ~350 bytes per task

**For 10,000 tasks per user**:
- Storage: ~3.5 MB per user
- With 100 users: ~350 MB total
- Well within Neon free tier limits

## Next Steps

1. Create contracts/task-api.yaml with extended endpoints
2. Create contracts/events.yaml with event schemas
3. Create contracts/dapr-components.yaml with Dapr definitions
4. Generate quickstart.md with setup instructions
