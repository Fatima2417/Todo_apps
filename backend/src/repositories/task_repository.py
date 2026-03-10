from sqlmodel import Session, select, update, delete
from ..models.task import Task, TaskCreate, TaskUpdate
from typing import List, Optional
from datetime import datetime


def create_task_for_user(*, db: Session, user_id: str, task_data: TaskCreate) -> Task:
    """
    Create a new task for a specific user.

    Args:
        db: Database session
        user_id: The ID of the user creating the task
        task_data: Task creation data

    Returns:
        The created Task object
    """
    # Create task with user_id manually to avoid Pydantic validation error if user_id is missing in TaskCreate
    data = task_data.model_dump()
    task = Task(**data, user_id=user_id)

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


def get_tasks_for_user(
    *,
    db: Session,
    user_id: str,
    completed_filter: Optional[bool] = None,
    priority_filter: Optional[str] = None,
    tags_filter: Optional[List[str]] = None,
    search_query: Optional[str] = None,
    due_date_from: Optional[str] = None,
    due_date_to: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None
) -> List[Task]:
    """
    Get all tasks for a specific user.

    Args:
        db: Database session
        user_id: The ID of the user whose tasks to retrieve
        completed_filter: Optional filter for completed status (None for all, True for completed, False for incomplete)
        priority_filter: Optional filter for priority (low, medium, high)
        tags_filter: Optional filter for tags (tasks must have at least one of these tags)
        search_query: Optional search query (searches in title and description using full-text search)
        due_date_from: Optional filter for tasks due after this date (ISO format)
        due_date_to: Optional filter for tasks due before this date (ISO format)
        sort_by: Optional sort field (created_at, due_date, priority, title, completed_at)
        sort_order: Optional sort order (asc, desc) - defaults to asc

    Returns:
        List of tasks belonging to the user
    """
    from sqlalchemy import func, text
    from datetime import datetime

    query = select(Task).where(Task.user_id == user_id)

    if completed_filter is not None:
        query = query.where(Task.completed == completed_filter)

    if priority_filter is not None:
        query = query.where(Task.priority == priority_filter)

    if tags_filter is not None and len(tags_filter) > 0:
        # Filter tasks that have at least one of the specified tags
        # Using PostgreSQL array overlap operator
        query = query.where(func.array_length(Task.tags, 1) > 0)
        # Check if any tag in tags_filter exists in Task.tags
        for tag in tags_filter:
            query = query.where(Task.tags.contains([tag]))

    if search_query is not None and search_query.strip():
        # Use PostgreSQL full-text search
        search_vector = func.to_tsvector('english', Task.title + ' ' + func.coalesce(Task.description, ''))
        search_tsquery = func.plainto_tsquery('english', search_query)
        query = query.where(search_vector.op('@@')(search_tsquery))

    if due_date_from is not None:
        try:
            from_date = datetime.fromisoformat(due_date_from.replace('Z', '+00:00'))
            query = query.where(Task.due_date >= from_date)
        except ValueError:
            pass  # Invalid date format, skip filter

    if due_date_to is not None:
        try:
            to_date = datetime.fromisoformat(due_date_to.replace('Z', '+00:00'))
            query = query.where(Task.due_date <= to_date)
        except ValueError:
            pass  # Invalid date format, skip filter

    # Apply sorting
    if sort_by:
        from sqlalchemy import asc, desc, nullslast

        # Map sort field to Task attribute
        sort_field_map = {
            'created_at': Task.created_at,
            'due_date': Task.due_date,
            'priority': Task.priority,
            'title': Task.title,
            'completed_at': Task.completed_at
        }

        if sort_by in sort_field_map:
            field = sort_field_map[sort_by]

            # Determine sort order (default to ascending)
            order_func = desc if sort_order == 'desc' else asc

            # Apply nulls last for nullable fields
            if sort_by in ['due_date', 'completed_at']:
                query = query.order_by(nullslast(order_func(field)))
            else:
                query = query.order_by(order_func(field))

    return db.exec(query).all()


def get_task_by_id_for_user(*, db: Session, task_id: int, user_id: str) -> Optional[Task]:
    """
    Get a specific task by ID for a specific user.

    Args:
        db: Database session
        task_id: The ID of the task to retrieve
        user_id: The ID of the user who owns the task

    Returns:
        The task if it exists and belongs to the user, None otherwise
    """
    query = select(Task).where(Task.id == task_id).where(Task.user_id == user_id)
    return db.exec(query).first()


def update_task_for_user(*, db: Session, task_id: int, user_id: str, task_update: TaskUpdate) -> Optional[Task]:
    """
    Update a specific task for a specific user.

    Args:
        db: Database session
        task_id: The ID of the task to update
        user_id: The ID of the user who owns the task
        task_update: Task update data

    Returns:
        The updated task if successful, None if task doesn't exist or doesn't belong to user
    """
    # Get the existing task to ensure it belongs to the user
    existing_task = get_task_by_id_for_user(db=db, task_id=task_id, user_id=user_id)
    if not existing_task:
        return None

    # Update the task with new data
    task_data = task_update.dict(exclude_unset=True)
    for field, value in task_data.items():
        setattr(existing_task, field, value)

    existing_task.updated_at = datetime.utcnow()

    db.add(existing_task)
    db.commit()
    db.refresh(existing_task)

    return existing_task


def delete_task_for_user(*, db: Session, task_id: int, user_id: str) -> bool:
    """
    Delete a specific task for a specific user.

    Args:
        db: Database session
        task_id: The ID of the task to delete
        user_id: The ID of the user who owns the task

    Returns:
        True if deletion was successful, False if task doesn't exist or doesn't belong to user
    """
    # Check if the task exists and belongs to the user
    existing_task = get_task_by_id_for_user(db=db, task_id=task_id, user_id=user_id)
    if not existing_task:
        return False

    # Delete the task
    db.delete(existing_task)
    db.commit()

    return True


def get_user_tags(*, db: Session, user_id: str) -> List[str]:
    """
    Get all unique tags used by a specific user.

    Args:
        db: Database session
        user_id: The ID of the user whose tags to retrieve

    Returns:
        List of unique tag strings
    """
    # Get all tasks for the user
    tasks = db.exec(select(Task).where(Task.user_id == user_id)).all()

    # Collect all unique tags
    unique_tags = set()
    for task in tasks:
        if task.tags:
            unique_tags.update(task.tags)

    return sorted(list(unique_tags))