"""
Notification Service - Microservice for handling task reminders.

This service listens to reminder.due events via Dapr Pub/Sub and logs notifications.
In Phase 5A (local), it only logs. In Phase 5B (cloud), it would send real notifications.
"""

from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Notification Service", version="1.0.0")


class ReminderEvent(BaseModel):
    """Event payload for reminder notifications"""
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
    return {"status": "healthy", "service": "notification-service"}


@app.post("/dapr/subscribe")
async def subscribe():
    """
    Dapr subscription endpoint.
    Tells Dapr which topics this service subscribes to.
    """
    subscriptions = [
        {
            "pubsubname": "pubsub",
            "topic": "reminders",
            "route": "/reminder-due"
        }
    ]
    logger.info(f"Dapr subscriptions configured: {subscriptions}")
    return subscriptions


@app.post("/reminder-due")
async def handle_reminder_due(request: Request):
    """
    Handle reminder.due events from Dapr Pub/Sub.

    Phase 5A: Logs the notification
    Phase 5B: Would send email/SMS/push notification
    """
    try:
        # Parse event payload
        event_data = await request.json()
        logger.info(f"Received reminder.due event: {event_data}")

        # Extract event details
        event = ReminderEvent(**event_data)

        task_id = event.data.get("task_id")
        user_id = event.data.get("user_id")
        task_title = event.data.get("task_title", "Task")

        # Phase 5A: Log notification (no real notification sent)
        from notifier import log_notification
        log_notification(
            user_id=user_id,
            task_id=task_id,
            task_title=task_title,
            notification_type="reminder"
        )

        logger.info(f"✅ Reminder notification logged for task {task_id}: '{task_title}' (user: {user_id})")

        return {"status": "SUCCESS"}

    except Exception as e:
        logger.error(f"Error processing reminder.due event: {str(e)}", exc_info=True)
        # Return success to avoid Dapr retries for unrecoverable errors
        return {"status": "SUCCESS"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
