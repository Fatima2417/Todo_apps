from pydantic import BaseModel, Field
from typing import Dict, Any
from datetime import datetime
import uuid


class TaskEvent(BaseModel):
    """
    Event payload structure for Kafka topics.
    Used for publishing task-related events to the event stream.
    """
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str = Field(..., description="Event type (e.g., task.created.v1)")
    event_version: str = Field(default="v1", description="Event schema version")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Event creation time (UTC)")
    user_id: str = Field(..., description="User who triggered the event")
    task_id: int = Field(..., description="Task affected by the event")
    data: Dict[str, Any] = Field(..., description="Event-specific payload")

    class Config:
        json_schema_extra = {
            "example": {
                "event_id": "550e8400-e29b-41d4-a716-446655440000",
                "event_type": "task.created.v1",
                "event_version": "v1",
                "timestamp": "2026-03-05T21:00:00Z",
                "user_id": "user123",
                "task_id": 456,
                "data": {
                    "title": "Finish report",
                    "priority": "high",
                    "tags": ["work", "deadline"],
                    "due_date": "2026-03-31T17:00:00Z"
                }
            }
        }
