"""
Audit Service - Microservice for logging all task events.

This service listens to all task events via Dapr Pub/Sub and logs them
for audit trail and history tracking.
"""

from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime
import logging
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Audit Service", version="1.0.0")


class TaskEvent(BaseModel):
    """Event payload for task events"""
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
    return {"status": "healthy", "service": "audit-service"}


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
            "route": "/task-event"
        },
        {
            "pubsubname": "pubsub",
            "topic": "reminders",
            "route": "/reminder-event"
        }
    ]
    logger.info(f"Dapr subscriptions configured: {subscriptions}")
    return subscriptions


@app.post("/task-event")
async def handle_task_event(request: Request):
    """
    Handle all task events from Dapr Pub/Sub.
    Logs events for audit trail.
    """
    try:
        # Parse event payload
        event_data = await request.json()
        event = TaskEvent(**event_data)

        # Log the event
        log_audit_event(
            event_type=event.event_type,
            user_id=event.user_id,
            task_id=event.task_id,
            data=event.data,
            timestamp=event.timestamp
        )

        logger.info(f"✅ Audited task event: {event.event_type} for task {event.task_id}")

        return {"status": "SUCCESS"}

    except Exception as e:
        logger.error(f"Error processing task event: {str(e)}", exc_info=True)
        return {"status": "SUCCESS"}


@app.post("/reminder-event")
async def handle_reminder_event(request: Request):
    """
    Handle reminder events from Dapr Pub/Sub.
    Logs reminder events for audit trail.
    """
    try:
        # Parse event payload
        event_data = await request.json()

        # Log the event
        logger.info(f"📬 Reminder event received: {json.dumps(event_data, indent=2)}")

        return {"status": "SUCCESS"}

    except Exception as e:
        logger.error(f"Error processing reminder event: {str(e)}", exc_info=True)
        return {"status": "SUCCESS"}


def log_audit_event(
    event_type: str,
    user_id: str,
    task_id: int,
    data: Dict[str, Any],
    timestamp: datetime
):
    """
    Log an audit event.

    In production, this would write to:
    - Database (audit_logs table)
    - File storage (S3, Azure Blob)
    - Log aggregation service (ELK, Splunk)
    """
    audit_log = f"""
    ╔══════════════════════════════════════════════════════════════╗
    ║                      📋 AUDIT LOG                             ║
    ╠══════════════════════════════════════════════════════════════╣
    ║ Event Type: {event_type:<48} ║
    ║ User ID:    {user_id:<48} ║
    ║ Task ID:    {task_id:<48} ║
    ║ Timestamp:  {timestamp.isoformat():<48} ║
    ╠══════════════════════════════════════════════════════════════╣
    ║ Data:                                                         ║
    """

    for key, value in data.items():
        audit_log += f"║   {key}: {str(value)[:54]:<54} ║\n"

    audit_log += "╚══════════════════════════════════════════════════════════════╝"

    logger.info(audit_log)

    # In production, also write to database:
    # await db.execute(
    #     "INSERT INTO audit_logs (event_type, user_id, task_id, data, timestamp) VALUES (?, ?, ?, ?, ?)",
    #     (event_type, user_id, task_id, json.dumps(data), timestamp)
    # )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
