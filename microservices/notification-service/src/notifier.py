"""
Notifier module - Handles notification logging and delivery.

Phase 5A (Local): Only logs notifications to console/file
Phase 5B (Cloud): Would integrate with email/SMS/push notification services
"""

import logging
from datetime import datetime
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def log_notification(
    user_id: str,
    task_id: int,
    task_title: str,
    notification_type: str = "reminder"
):
    """
    Log a notification (Phase 5A implementation).

    In Phase 5B, this would be replaced with actual notification delivery
    via email, SMS, or push notifications.

    Args:
        user_id: ID of the user to notify
        task_id: ID of the task
        task_title: Title of the task
        notification_type: Type of notification (reminder, overdue, etc.)
    """
    timestamp = datetime.utcnow().isoformat()

    notification_message = f"""
    ╔══════════════════════════════════════════════════════════════╗
    ║                    📬 NOTIFICATION LOG                        ║
    ╠══════════════════════════════════════════════════════════════╣
    ║ Type:       {notification_type.upper():<48} ║
    ║ User ID:    {user_id:<48} ║
    ║ Task ID:    {task_id:<48} ║
    ║ Task:       {task_title[:48]:<48} ║
    ║ Timestamp:  {timestamp:<48} ║
    ╚══════════════════════════════════════════════════════════════╝
    """

    logger.info(notification_message)

    # In Phase 5B, this would call:
    # - send_email(user_id, task_title)
    # - send_sms(user_id, task_title)
    # - send_push_notification(user_id, task_title)


def send_email_notification(user_email: str, task_title: str, task_id: int):
    """
    Placeholder for email notification (Phase 5B).

    Would integrate with services like:
    - SendGrid
    - AWS SES
    - Mailgun
    """
    logger.info(f"[PHASE 5B] Would send email to {user_email} about task: {task_title}")


def send_sms_notification(user_phone: str, task_title: str, task_id: int):
    """
    Placeholder for SMS notification (Phase 5B).

    Would integrate with services like:
    - Twilio
    - AWS SNS
    """
    logger.info(f"[PHASE 5B] Would send SMS to {user_phone} about task: {task_title}")


def send_push_notification(user_id: str, task_title: str, task_id: int):
    """
    Placeholder for push notification (Phase 5B).

    Would integrate with services like:
    - Firebase Cloud Messaging (FCM)
    - Apple Push Notification Service (APNS)
    - OneSignal
    """
    logger.info(f"[PHASE 5B] Would send push notification to user {user_id} about task: {task_title}")
