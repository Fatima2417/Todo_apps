"""
Event Publisher Service
Publishes task events to Kafka via Dapr Pub/Sub component.
"""
import httpx
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from ..models.events import TaskEvent

logger = logging.getLogger(__name__)

# Dapr configuration
DAPR_HTTP_PORT = 3500
DAPR_PUBSUB_NAME = "pubsub"
TASK_EVENTS_TOPIC = "task-events"
REMINDERS_TOPIC = "reminders"


async def publish_event(
    event_type: str,
    user_id: str,
    task_id: int,
    data: Dict[str, Any],
    topic: str = TASK_EVENTS_TOPIC
) -> bool:
    """
    Publish an event to Kafka via Dapr Pub/Sub.

    Args:
        event_type: Type of event (e.g., task.created.v1)
        user_id: User who triggered the event
        task_id: Task affected by the event
        data: Event-specific payload
        topic: Kafka topic name (default: task-events)

    Returns:
        bool: True if published successfully, False otherwise
    """
    event = TaskEvent(
        event_type=event_type,
        user_id=user_id,
        task_id=task_id,
        data=data
    )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"http://localhost:{DAPR_HTTP_PORT}/v1.0/publish/{DAPR_PUBSUB_NAME}/{topic}",
                json=event.model_dump(mode='json')
            )
            response.raise_for_status()
            logger.info(f"Published event {event.event_type} for task {task_id}")
            return True
    except Exception as e:
        # Log error but don't block user action (fire-and-forget pattern)
        logger.error(f"Failed to publish event {event_type} for task {task_id}: {e}")
        return False


async def publish_task_created(user_id: str, task_id: int, task_data: Dict[str, Any]) -> bool:
    """Publish task.created.v1 event"""
    return await publish_event("task.created.v1", user_id, task_id, task_data)


async def publish_task_updated(
    user_id: str,
    task_id: int,
    before: Dict[str, Any],
    after: Dict[str, Any],
    changed_fields: list
) -> bool:
    """Publish task.updated.v1 event"""
    data = {
        "before": before,
        "after": after,
        "changed_fields": changed_fields
    }
    return await publish_event("task.updated.v1", user_id, task_id, data)


async def publish_task_deleted(user_id: str, task_id: int, task_data: Dict[str, Any]) -> bool:
    """Publish task.deleted.v1 event"""
    return await publish_event("task.deleted.v1", user_id, task_id, task_data)


async def publish_task_completed(user_id: str, task_id: int, task_data: Dict[str, Any]) -> bool:
    """Publish task.completed.v1 event"""
    return await publish_event("task.completed.v1", user_id, task_id, task_data)


async def publish_task_uncompleted(user_id: str, task_id: int, task_data: Dict[str, Any]) -> bool:
    """Publish task.uncompleted.v1 event"""
    return await publish_event("task.uncompleted.v1", user_id, task_id, task_data)


async def publish_reminder_due(user_id: str, task_id: int, reminder_data: Dict[str, Any]) -> bool:
    """Publish reminder.due.v1 event to reminders topic"""
    return await publish_event("reminder.due.v1", user_id, task_id, reminder_data, topic=REMINDERS_TOPIC)
