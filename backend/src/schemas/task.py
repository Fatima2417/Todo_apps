from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TaskPriority(str, Enum):
    """Priority levels for tasks"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskCreate(BaseModel):
    """Schema for validating new task creation requests."""
    title: str = Field(..., min_length=1, max_length=200, description="The task title")
    description: Optional[str] = Field(None, max_length=1000, description="Detailed task description")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority level")
    tags: List[str] = Field(default_factory=list, description="Task tags for categorization")
    due_date: Optional[datetime] = Field(None, description="Task due date with time")
    remind_at: Optional[datetime] = Field(None, description="Reminder time before due date")
    recurring_pattern: Optional[str] = Field(None, max_length=100, description="Recurrence pattern (daily, weekly, monthly, or cron)")

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        if len(v) > 20:
            raise ValueError('Maximum 20 tags allowed')
        for tag in v:
            if len(tag) > 50:
                raise ValueError('Tag length must be <= 50 characters')
        return v

    @field_validator('remind_at')
    @classmethod
    def validate_reminder(cls, v, info):
        if v and info.data.get('due_date'):
            if v >= info.data['due_date']:
                raise ValueError('Reminder must be before due date')
        return v

    @field_validator('recurring_pattern')
    @classmethod
    def validate_recurrence(cls, v):
        if v:
            valid_patterns = ['daily', 'weekly', 'monthly']
            if v not in valid_patterns:
                # Check if it's a valid cron expression (basic validation)
                # Cron format: minute hour day month weekday
                parts = v.split()
                if len(parts) != 5:
                    raise ValueError('Recurring pattern must be "daily", "weekly", "monthly", or a valid cron expression (5 fields)')
                # Basic cron field validation
                for part in parts:
                    if part not in ['*', '?'] and not part.replace('-', '').replace('/', '').replace(',', '').isdigit():
                        raise ValueError('Invalid cron expression format')
        return v


class TaskUpdate(BaseModel):
    """Schema for validating task update requests."""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Updated task title")
    description: Optional[str] = Field(None, max_length=1000, description="Updated task description")
    completed: Optional[bool] = Field(None, description="Updated completion status")
    priority: Optional[TaskPriority] = Field(None, description="Updated priority level")
    tags: Optional[List[str]] = Field(None, description="Updated tags")
    due_date: Optional[datetime] = Field(None, description="Updated due date")
    remind_at: Optional[datetime] = Field(None, description="Updated reminder time")
    recurring_pattern: Optional[str] = Field(None, description="Updated recurrence pattern")

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        if v and len(v) > 20:
            raise ValueError('Maximum 20 tags allowed')
        if v:
            for tag in v:
                if len(tag) > 50:
                    raise ValueError('Tag length must be <= 50 characters')
        return v


class TaskPublic(BaseModel):
    """Schema for serializing task responses for external consumption."""
    id: int
    user_id: str
    title: str
    description: Optional[str] = None
    completed: bool
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    priority: TaskPriority
    tags: List[str]
    due_date: Optional[datetime] = None
    remind_at: Optional[datetime] = None
    recurring_pattern: Optional[str] = None
    is_recurring: bool
    parent_task_id: Optional[int] = None

    class Config:
        from_attributes = True  # Enables ORM to Pydantic conversion