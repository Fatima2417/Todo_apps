"""
Reminder Service - Handles scheduling and canceling reminders using Dapr Jobs API.

This service integrates with Dapr's Jobs API to schedule exact-time reminders
for tasks with remind_at timestamps.
"""

import httpx
import os
import logging
from datetime import datetime
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
DAPR_HTTP_PORT = os.getenv("DAPR_HTTP_PORT", "3500")


async def schedule_reminder(task_id: int, user_id: str, remind_at: datetime, task_title: str) -> bool:
    """
    Schedule a reminder using Dapr Jobs API.

    Args:
        task_id: ID of the task
        user_id: ID of the user who owns the task
        remind_at: When to trigger the reminder
        task_title: Title of the task for the reminder

    Returns:
        True if scheduled successfully, False otherwise
    """
    try:
        job_name = f"reminder-task-{task_id}"
        due_time = remind_at.strftime("%Y-%m-%dT%H:%M:%SZ")

        payload = {
            "schedule": f"@once {due_time}",
            "data": {
                "task_id": task_id,
                "user_id": user_id,
                "task_title": task_title,
                "type": "reminder"
            }
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.put(
                f"http://localhost:{DAPR_HTTP_PORT}/v1.0-beta1/jobs/{job_name}",
                json=payload
            )

            if response.status_code in [200, 201, 204]:
                logger.info(f"Scheduled reminder for task {task_id} at {due_time}")
                return True
            else:
                logger.error(f"Failed to schedule reminder: {response.status_code} - {response.text}")
                return False

    except Exception as e:
        logger.error(f"Error scheduling reminder for task {task_id}: {str(e)}", exc_info=True)
        return False


async def cancel_reminder(task_id: int) -> bool:
    """
    Cancel a scheduled reminder using Dapr Jobs API.

    Args:
        task_id: ID of the task whose reminder to cancel

    Returns:
        True if canceled successfully, False otherwise
    """
    try:
        job_name = f"reminder-task-{task_id}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.delete(
                f"http://localhost:{DAPR_HTTP_PORT}/v1.0-beta1/jobs/{job_name}"
            )

            if response.status_code in [200, 204, 404]:  # 404 is OK - job doesn't exist
                logger.info(f"Canceled reminder for task {task_id}")
                return True
            else:
                logger.error(f"Failed to cancel reminder: {response.status_code} - {response.text}")
                return False

    except Exception as e:
        logger.error(f"Error canceling reminder for task {task_id}: {str(e)}", exc_info=True)
        return False


async def reschedule_reminder(task_id: int, user_id: str, remind_at: datetime, task_title: str) -> bool:
    """
    Reschedule a reminder by canceling the old one and creating a new one.

    Args:
        task_id: ID of the task
        user_id: ID of the user who owns the task
        remind_at: New reminder time
        task_title: Title of the task

    Returns:
        True if rescheduled successfully, False otherwise
    """
    # Cancel existing reminder (if any)
    await cancel_reminder(task_id)

    # Schedule new reminder
    return await schedule_reminder(task_id, user_id, remind_at, task_title)
