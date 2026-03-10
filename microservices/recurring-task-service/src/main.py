"""
Recurring Task Service - Microservice for handling recurring task logic.

This service listens to task completion events via Dapr Pub/Sub and automatically
creates the next occurrence of recurring tasks.
"""

from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import httpx
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Recurring Task Service", version="1.0.0")

# Environment variables
DAPR_HTTP_PORT = os.getenv("DAPR_HTTP_PORT", "3500")
BACKEND_APP_ID = os.getenv("BACKEND_APP_ID", "todo-backend")


class TaskCompletedEvent(BaseModel):
    """Event payload for task completion"""
    event_id: str
    event_type: str
    event_version: str
    timestamp: datetime
    user_id: str
    task_id: int
    data: Dict[str, Any]


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "recurring-task-service"}


@app.post("/dapr/subscribe")
async def subscribe():
    """
    Dapr subscription endpoint.
    Tells Dapr which topics this service subscribes to.
    """
    subscriptions = [
        {
            "pubsubname": "pubsub",
            "topic": "task-events",
            "route": "/task-completed"
        }
    ]
    logger.info(f"Dapr subscriptions configured: {subscriptions}")
    return subscriptions


@app.post("/task-completed")
async def handle_task_completed(request: Request):
    """
    Handle task completion events from Dapr Pub/Sub.
    Creates next occurrence for recurring tasks.
    """
    try:
        # Parse event payload
        event_data = await request.json()
        logger.info(f"Received task completion event: {event_data}")

        # Extract event details
        event = TaskCompletedEvent(**event_data)

        # Check if task is recurring and was just completed
        after_data = event.data.get("after", {})
        before_data = event.data.get("before", {})

        is_completed = after_data.get("completed", False)
        was_completed = before_data.get("completed", False)
        recurring_pattern = after_data.get("recurring_pattern")

        # Only process if task was just marked complete and has recurring pattern
        if is_completed and not was_completed and recurring_pattern:
            logger.info(f"Processing recurring task {event.task_id} with pattern: {recurring_pattern}")

            # Calculate next due date
            current_due_date = after_data.get("due_date")
            if current_due_date:
                from recurrence import calculate_next_due_date

                current_due = datetime.fromisoformat(current_due_date.replace('Z', '+00:00'))
                next_due = calculate_next_due_date(current_due, recurring_pattern)

                # Create new task via backend API using Dapr service invocation
                await create_next_recurring_task(
                    user_id=event.user_id,
                    original_task_id=event.task_id,
                    next_due_date=next_due,
                    recurring_pattern=recurring_pattern,
                    task_data=after_data
                )
            else:
                logger.warning(f"Recurring task {event.task_id} has no due_date, skipping")

        return {"status": "SUCCESS"}

    except Exception as e:
        logger.error(f"Error processing task completion event: {str(e)}", exc_info=True)
        # Return success to avoid Dapr retries for unrecoverable errors
        return {"status": "SUCCESS"}


async def create_next_recurring_task(
    user_id: str,
    original_task_id: int,
    next_due_date: datetime,
    recurring_pattern: str,
    task_data: Dict[str, Any]
):
    """
    Create the next occurrence of a recurring task by calling the backend API.

    Args:
        user_id: User ID who owns the task
        original_task_id: ID of the completed task
        next_due_date: Calculated next due date
        recurring_pattern: Recurrence pattern
        task_data: Original task data
    """
    try:
        # Prepare new task payload
        new_task = {
            "title": task_data.get("title", "Recurring Task"),
            "description": task_data.get("description"),
            "priority": task_data.get("priority", "medium"),
            "tags": task_data.get("tags", []),
            "due_date": next_due_date.isoformat(),
            "remind_at": None,  # Don't copy reminder
            "recurring_pattern": recurring_pattern,
            "parent_task_id": original_task_id
        }

        # Call backend API via Dapr service invocation
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"http://localhost:{DAPR_HTTP_PORT}/v1.0/invoke/{BACKEND_APP_ID}/method/api/v1/{user_id}/tasks",
                json=new_task
            )

            if response.status_code == 201:
                created_task = response.json()
                logger.info(f"Created next recurring task {created_task['id']} for user {user_id}")
            else:
                logger.error(f"Failed to create recurring task: {response.status_code} - {response.text}")

    except Exception as e:
        logger.error(f"Error creating next recurring task: {str(e)}", exc_info=True)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
