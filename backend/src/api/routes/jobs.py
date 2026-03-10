"""
Jobs API routes for handling Dapr Jobs callbacks.

This module handles callbacks from Dapr Jobs API when scheduled jobs trigger,
such as task reminders.
"""

from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
import logging

from ...services.event_publisher import publish_event

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["jobs"])


@router.post("/jobs/trigger")
async def handle_job_trigger(request: Request):
    """
    Handle job trigger callbacks from Dapr Jobs API.

    This endpoint is called by Dapr when a scheduled job triggers.
    For reminders, it publishes a reminder.due event to the reminders topic.

    Args:
        request: FastAPI request containing job data

    Returns:
        Success status for Dapr
    """
    try:
        # Parse job data from Dapr
        job_data = await request.json()
        logger.info(f"Received job trigger: {job_data}")

        # Extract job details
        data = job_data.get("data", {})
        job_type = data.get("type")

        if job_type == "reminder":
            task_id = data.get("task_id")
            user_id = data.get("user_id")
            task_title = data.get("task_title", "Task")

            # Publish reminder.due event
            await publish_event(
                topic="reminders",
                event_type="reminder.due.v1",
                data={
                    "task_id": task_id,
                    "user_id": user_id,
                    "task_title": task_title
                }
            )

            logger.info(f"Published reminder.due event for task {task_id}")

        return {"status": "SUCCESS"}

    except Exception as e:
        logger.error(f"Error processing job trigger: {str(e)}", exc_info=True)
        # Return success to avoid Dapr retries for unrecoverable errors
        return {"status": "SUCCESS"}
