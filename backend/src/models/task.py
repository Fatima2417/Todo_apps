from sqlmodel import SQLModel, Field, Column
from sqlalchemy import ARRAY, String, Enum as SQLEnum
from datetime import datetime
from typing import Optional, List
from enum import Enum


class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class TaskPriority(str, Enum):
    """Priority levels for tasks"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskBase(SQLModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)


class Task(TaskBase, table=True):
    """
    Task model representing a todo item created by a user.
    Extended with priority, tags, due dates, reminders, and recurring patterns.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)  # SECURITY CRITICAL
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)

    # Phase 5A: Advanced Features
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, sa_column=Column(SQLEnum(TaskPriority)))
    tags: List[str] = Field(default_factory=list, sa_column=Column(ARRAY(String)))
    due_date: Optional[datetime] = Field(default=None)
    remind_at: Optional[datetime] = Field(default=None)
    recurring_pattern: Optional[str] = Field(default=None, max_length=100)
    is_recurring: bool = Field(default=False)
    parent_task_id: Optional[int] = Field(default=None, foreign_key="task.id")


class TaskRead(TaskBase):
    id: int
    user_id: str
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


class TaskCreate(TaskBase):
    priority: TaskPriority = TaskPriority.MEDIUM
    tags: List[str] = Field(default_factory=list)
    due_date: Optional[datetime] = None
    remind_at: Optional[datetime] = None
    recurring_pattern: Optional[str] = None


class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[TaskPriority] = None
    tags: Optional[List[str]] = None
    due_date: Optional[datetime] = None
    remind_at: Optional[datetime] = None
    recurring_pattern: Optional[str] = None