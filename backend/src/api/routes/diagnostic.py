"""
Diagnostic API Endpoints
Purpose: Echo back exactly what the backend receives to identify data loss
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime
import json
from sqlmodel import Session, select

router = APIRouter(prefix="/api/v1/diagnostic", tags=["diagnostic"])


class DiagnosticTask(BaseModel):
    """Flexible model that accepts anything"""
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    tags: Optional[List[str]] = []
    due_date: Optional[datetime] = None
    remind_at: Optional[datetime] = None
    recurring_pattern: Optional[str] = None


@router.post("/echo")
async def echo_request(data: Dict[str, Any]):
    """
    Echo back EXACTLY what was received with type information.
    This bypasses all validation to see raw data.
    """
    result = {
        "timestamp": datetime.utcnow().isoformat(),
        "received_data": data,
        "data_types": {},
        "analysis": {}
    }

    # Analyze each field
    for key, value in data.items():
        result["data_types"][key] = {
            "type": type(value).__name__,
            "value": value,
            "is_none": value is None,
            "is_empty_string": value == "",
            "is_empty_list": value == [] if isinstance(value, list) else False
        }

    # Specific checks
    result["analysis"] = {
        "priority_check": {
            "received": data.get("priority"),
            "is_valid": data.get("priority") in ["low", "medium", "high"],
            "type": type(data.get("priority")).__name__
        },
        "tags_check": {
            "received": data.get("tags"),
            "is_list": isinstance(data.get("tags"), list),
            "count": len(data.get("tags")) if isinstance(data.get("tags"), list) else 0,
            "type": type(data.get("tags")).__name__
        },
        "due_date_check": {
            "received": data.get("due_date"),
            "is_iso_format": isinstance(data.get("due_date"), str) and "T" in str(data.get("due_date")) if data.get("due_date") else False,
            "type": type(data.get("due_date")).__name__
        },
        "remind_at_check": {
            "received": data.get("remind_at"),
            "is_iso_format": isinstance(data.get("remind_at"), str) and "T" in str(data.get("remind_at")) if data.get("remind_at") else False,
            "type": type(data.get("remind_at")).__name__
        }
    }

    return result


@router.post("/test-task")
async def test_task_creation(task: DiagnosticTask):
    """
    Test task creation with Pydantic validation.
    Shows what Pydantic does to the data.
    """
    task_dict = task.model_dump()

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "pydantic_model": task_dict,
        "field_types": {
            "priority": {
                "type": type(task.priority).__name__,
                "value": task.priority
            },
            "tags": {
                "type": type(task.tags).__name__,
                "value": task.tags,
                "count": len(task.tags) if task.tags else 0
            },
            "due_date": {
                "type": type(task.due_date).__name__,
                "value": task.due_date.isoformat() if task.due_date else None,
                "is_none": task.due_date is None
            },
            "remind_at": {
                "type": type(task.remind_at).__name__,
                "value": task.remind_at.isoformat() if task.remind_at else None,
                "is_none": task.remind_at is None
            }
        },
        "validation": {
            "priority_valid": task.priority in ["low", "medium", "high"],
            "tags_is_list": isinstance(task.tags, list),
            "due_date_is_datetime": isinstance(task.due_date, datetime) if task.due_date else False
        }
    }


@router.get("/inspect-task/{user_id}/{task_id}")
async def inspect_task(user_id: str, task_id: int):
    """
    Return raw database record for a task.
    Shows exactly what's in the database.
    """
    try:
        from ...dependencies import get_db
        from ...models.task import Task

        # Get database session
        db = next(get_db())

        # Query task
        statement = select(Task).where(Task.id == task_id).where(Task.user_id == user_id)
        task = db.exec(statement).first()

        if not task:
            return {
                "error": "Task not found",
                "task_id": task_id,
                "user_id": user_id
            }

        # Convert to dict with type information
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "task_id": task.id,
            "database_record": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "priority": task.priority,
                "tags": task.tags,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "remind_at": task.remind_at.isoformat() if task.remind_at else None,
                "recurring_pattern": task.recurring_pattern,
                "completed": task.completed,
                "created_at": task.created_at.isoformat() if task.created_at else None,
                "updated_at": task.updated_at.isoformat() if task.updated_at else None
            },
            "field_types": {
                "priority": {
                    "type": type(task.priority).__name__,
                    "value": str(task.priority) if task.priority else None,
                    "is_none": task.priority is None
                },
                "tags": {
                    "type": type(task.tags).__name__,
                    "value": task.tags,
                    "count": len(task.tags) if task.tags else 0,
                    "is_none": task.tags is None
                },
                "due_date": {
                    "type": type(task.due_date).__name__,
                    "value": task.due_date.isoformat() if task.due_date else None,
                    "is_none": task.due_date is None
                },
                "remind_at": {
                    "type": type(task.remind_at).__name__,
                    "value": task.remind_at.isoformat() if task.remind_at else None,
                    "is_none": task.remind_at is None
                }
            }
        }

    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__,
            "task_id": task_id,
            "user_id": user_id
        }


@router.get("/list-recent-tasks/{user_id}")
async def list_recent_tasks(user_id: str, limit: int = 5):
    """
    List recent tasks with full field information.
    Shows what's actually in the database.
    """
    try:
        from ...dependencies import get_db
        from ...models.task import Task

        db = next(get_db())

        statement = select(Task).where(Task.user_id == user_id).order_by(Task.created_at.desc()).limit(limit)
        tasks = db.exec(statement).all()

        result = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "count": len(tasks),
            "tasks": []
        }

        for task in tasks:
            result["tasks"].append({
                "id": task.id,
                "title": task.title,
                "priority": {
                    "value": str(task.priority) if task.priority else None,
                    "type": type(task.priority).__name__,
                    "is_none": task.priority is None
                },
                "tags": {
                    "value": task.tags,
                    "count": len(task.tags) if task.tags else 0,
                    "type": type(task.tags).__name__,
                    "is_none": task.tags is None
                },
                "due_date": {
                    "value": task.due_date.isoformat() if task.due_date else None,
                    "type": type(task.due_date).__name__,
                    "is_none": task.due_date is None
                },
                "remind_at": {
                    "value": task.remind_at.isoformat() if task.remind_at else None,
                    "type": type(task.remind_at).__name__,
                    "is_none": task.remind_at is None
                },
                "created_at": task.created_at.isoformat() if task.created_at else None
            })

        return result

    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__,
            "user_id": user_id
        }


@router.get("/health")
async def health_check():
    """Simple health check"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Diagnostic API is running"
    }
