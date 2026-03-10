"""
Recurrence calculation utilities for recurring tasks.

This module provides functions to calculate the next due date for recurring tasks
based on various recurrence patterns (daily, weekly, monthly, or cron expressions).
"""

from datetime import datetime, timedelta
from typing import Optional
import re


def calculate_next_due_date(current_due_date: datetime, pattern: str) -> datetime:
    """
    Calculate the next due date based on the recurrence pattern.

    Args:
        current_due_date: The current due date of the task
        pattern: Recurrence pattern (daily, weekly, monthly, or cron expression)

    Returns:
        The next due date as a datetime object

    Raises:
        ValueError: If the pattern is invalid or unsupported
    """
    if not current_due_date:
        raise ValueError("Current due date is required for recurrence calculation")

    pattern = pattern.lower().strip()

    # Handle simple patterns
    if pattern == 'daily':
        return current_due_date + timedelta(days=1)
    elif pattern == 'weekly':
        return current_due_date + timedelta(weeks=1)
    elif pattern == 'monthly':
        # Add one month (handle month overflow)
        next_month = current_due_date.month + 1
        next_year = current_due_date.year
        if next_month > 12:
            next_month = 1
            next_year += 1

        # Handle day overflow (e.g., Jan 31 -> Feb 28/29)
        try:
            return current_due_date.replace(year=next_year, month=next_month)
        except ValueError:
            # Day doesn't exist in next month, use last day of month
            if next_month == 2:
                # February - check for leap year
                if next_year % 4 == 0 and (next_year % 100 != 0 or next_year % 400 == 0):
                    day = 29
                else:
                    day = 28
            elif next_month in [4, 6, 9, 11]:
                day = 30
            else:
                day = 31
            return current_due_date.replace(year=next_year, month=next_month, day=day)
    else:
        # Assume it's a cron expression
        return calculate_next_from_cron(current_due_date, pattern)


def calculate_next_from_cron(current_date: datetime, cron_expr: str) -> datetime:
    """
    Calculate next due date from a cron expression.

    Simplified cron parser supporting basic patterns.
    Format: minute hour day month weekday

    Args:
        current_date: Current due date
        cron_expr: Cron expression string

    Returns:
        Next due date

    Raises:
        ValueError: If cron expression is invalid
    """
    parts = cron_expr.split()
    if len(parts) != 5:
        raise ValueError("Cron expression must have 5 fields: minute hour day month weekday")

    minute_expr, hour_expr, day_expr, month_expr, weekday_expr = parts

    # Start from the next minute
    next_date = current_date + timedelta(minutes=1)
    next_date = next_date.replace(second=0, microsecond=0)

    # Simple implementation: just add 1 day for now
    # Full cron parsing would require a library like croniter
    # For MVP, we'll use a simplified approach

    # If all fields are *, it means daily at the same time
    if all(p == '*' for p in parts):
        return current_date + timedelta(days=1)

    # For other patterns, add 1 day and adjust time if specified
    next_date = current_date + timedelta(days=1)

    # Parse minute
    if minute_expr != '*':
        try:
            minute = int(minute_expr)
            next_date = next_date.replace(minute=minute)
        except ValueError:
            pass

    # Parse hour
    if hour_expr != '*':
        try:
            hour = int(hour_expr)
            next_date = next_date.replace(hour=hour)
        except ValueError:
            pass

    return next_date


def is_valid_cron_expression(cron_expr: str) -> bool:
    """
    Validate a cron expression format.

    Args:
        cron_expr: Cron expression to validate

    Returns:
        True if valid, False otherwise
    """
    parts = cron_expr.split()
    if len(parts) != 5:
        return False

    for part in parts:
        # Allow *, numbers, ranges (1-5), steps (*/2), and lists (1,3,5)
        if part in ['*', '?']:
            continue
        if not re.match(r'^[\d\-\,\/\*]+$', part):
            return False

    return True
