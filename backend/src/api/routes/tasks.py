from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlmodel import Session

from ...dependencies import get_db, validate_user_path
from ...schemas.task import TaskCreate, TaskUpdate, TaskPublic
from ...services.task_service import (
    create_task_for_user,
    get_tasks_for_user,
    get_task_by_id_for_user,
    update_task_for_user,
    delete_task_for_user,
    toggle_task_completion_for_user,
    get_user_tags
)
from ...services.event_publisher import publish_task_created, publish_task_updated
from ...services.reminder_service import schedule_reminder, cancel_reminder, reschedule_reminder

router = APIRouter(tags=["tasks"])


@router.get("/tasks")
def list_tasks(
    user_id: str = Depends(validate_user_path),
    db: Session = Depends(get_db),
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    tags: Optional[str] = None,
    q: Optional[str] = None,
    status: Optional[str] = None,
    due_date_from: Optional[str] = None,
    due_date_to: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None
):
    """
    List all tasks for a specific user with result count.

    Args:
        user_id: The ID of the user whose tasks to retrieve (validated via JWT and path)
        db: Database session
        completed: Optional filter for completion status
        priority: Optional filter for priority (low, medium, high)
        tags: Optional filter for tags (comma-separated, e.g., "work,personal")
        q: Optional search query (searches in title and description)
        status: Optional filter for status (all, pending, completed)
        due_date_from: Optional filter for tasks due after this date (ISO format)
        due_date_to: Optional filter for tasks due before this date (ISO format)
        sort_by: Optional sort field (created_at, due_date, priority, title, completed_at)
        sort_order: Optional sort order (asc, desc)

    Returns:
        Dict with tasks list and total count
    """
    try:
        # Parse tags if provided
        tags_list = tags.split(',') if tags else None

        # Handle status filter (convert to completed boolean)
        completed_filter = completed
        if status:
            if status == 'pending':
                completed_filter = False
            elif status == 'completed':
                completed_filter = True
            # 'all' or None means no filter

        tasks = get_tasks_for_user(
            db=db,
            user_id=user_id,
            completed_filter=completed_filter,
            priority_filter=priority,
            tags_filter=tags_list,
            search_query=q,
            due_date_from=due_date_from,
            due_date_to=due_date_to,
            sort_by=sort_by,
            sort_order=sort_order
        )
        return {
            "tasks": tasks,
            "total": len(tasks)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving tasks: {str(e)}"
        )


@router.get("/tasks/tags", response_model=List[str])
def get_tags(
    user_id: str = Depends(validate_user_path),
    db: Session = Depends(get_db)
):
    """
    Get all unique tags used by a specific user for autocomplete.

    Args:
        user_id: The ID of the user whose tags to retrieve (validated via JWT and path)
        db: Database session

    Returns:
        List of unique tag strings
    """
    try:
        tags = get_user_tags(db=db, user_id=user_id)
        return tags
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving tags: {str(e)}"
        )


@router.post("/tasks", response_model=TaskPublic, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_create: TaskCreate,
    user_id: str = Depends(validate_user_path),
    db: Session = Depends(get_db)
):
    """
    Create a new task for a specific user.

    Args:
        task_create: Task creation data
        user_id: The ID of the user creating the task (validated via JWT and path)
        db: Database session

    Returns:
        Created TaskPublic object
    """
    try:
        task = create_task_for_user(db=db, user_id=user_id, task_data=task_create)

        # Schedule reminder if remind_at is provided
        if task.remind_at:
            await schedule_reminder(
                task_id=task.id,
                user_id=user_id,
                remind_at=task.remind_at,
                task_title=task.title
            )

        # Publish task.created.v1 event (fire-and-forget)
        await publish_task_created(
            user_id=user_id,
            task_id=task.id,
            task_data={
                "title": task.title,
                "description": task.description,
                "priority": task.priority,
                "tags": task.tags,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "remind_at": task.remind_at.isoformat() if task.remind_at else None,
                "recurring_pattern": task.recurring_pattern,
                "is_recurring": task.is_recurring
            }
        )

        return task
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating task: {str(e)}"
        )


@router.get("/tasks/{task_id}", response_model=TaskPublic)
def get_task(
    task_id: int,
    user_id: str = Depends(validate_user_path),
    db: Session = Depends(get_db)
):
    """
    Get a specific task for a specific user.

    Args:
        task_id: The ID of the task to retrieve
        user_id: The ID of the user requesting the task (validated via JWT and path)
        db: Database session

    Returns:
        TaskPublic object

    Raises:
        HTTPException: If task doesn't exist or doesn't belong to user
    """
    try:
        task = get_task_by_id_for_user(db=db, task_id=task_id, user_id=user_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving task: {str(e)}"
        )


@router.put("/tasks/{task_id}", response_model=TaskPublic)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    user_id: str = Depends(validate_user_path),
    db: Session = Depends(get_db)
):
    """
    Update a specific task for a specific user.

    Args:
        task_id: The ID of the task to update
        task_update: Task update data
        user_id: The ID of the user updating the task (validated via JWT and path)
        db: Database session

    Returns:
        Updated TaskPublic object

    Raises:
        HTTPException: If task doesn't exist or doesn't belong to user
    """
    try:
        # Get the task before update for event publishing
        task_before = get_task_by_id_for_user(db=db, task_id=task_id, user_id=user_id)
        if not task_before:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or does not belong to user"
            )

        updated_task = update_task_for_user(
            db=db,
            task_id=task_id,
            user_id=user_id,
            task_update=task_update
        )
        if not updated_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or does not belong to user"
            )

        # Handle reminder rescheduling if remind_at changed
        if 'remind_at' in task_update.model_dump(exclude_unset=True):
            if updated_task.remind_at:
                # Reschedule reminder
                await reschedule_reminder(
                    task_id=task_id,
                    user_id=user_id,
                    remind_at=updated_task.remind_at,
                    task_title=updated_task.title
                )
            else:
                # Cancel reminder if remind_at was removed
                await cancel_reminder(task_id)

        # Determine changed fields
        changed_fields = []
        for field in task_update.model_dump(exclude_unset=True).keys():
            changed_fields.append(field)

        # Publish task.updated.v1 event (fire-and-forget)
        if changed_fields:
            await publish_task_updated(
                user_id=user_id,
                task_id=task_id,
                before={
                    "title": task_before.title,
                    "description": task_before.description,
                    "completed": task_before.completed,
                    "priority": task_before.priority,
                    "tags": task_before.tags,
                    "due_date": task_before.due_date.isoformat() if task_before.due_date else None,
                    "remind_at": task_before.remind_at.isoformat() if task_before.remind_at else None
                },
                after={
                    "title": updated_task.title,
                    "description": updated_task.description,
                    "completed": updated_task.completed,
                    "priority": updated_task.priority,
                    "tags": updated_task.tags,
                    "due_date": updated_task.due_date.isoformat() if updated_task.due_date else None,
                    "remind_at": updated_task.remind_at.isoformat() if updated_task.remind_at else None
                },
                changed_fields=changed_fields
            )

        return updated_task
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating task: {str(e)}"
        )


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    user_id: str = Depends(validate_user_path),
    db: Session = Depends(get_db)
):
    """
    Delete a specific task for a specific user.
    Cancels any scheduled reminders.

    Args:
        task_id: The ID of the task to delete
        user_id: The ID of the user deleting the task (validated via JWT and path)
        db: Database session

    Raises:
        HTTPException: If task doesn't exist or doesn't belong to user
    """
    try:
        # Cancel reminder before deleting
        await cancel_reminder(task_id)

        success = delete_task_for_user(db=db, task_id=task_id, user_id=user_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or does not belong to user"
            )
        return
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting task: {str(e)}"
        )


@router.patch("/tasks/{task_id}/complete", response_model=TaskPublic)
async def toggle_task_completion(
    task_id: int,
    user_id: str = Depends(validate_user_path),
    db: Session = Depends(get_db)
):
    """
    Toggle completion status of a specific task for a specific user.
    If task is recurring and being marked complete, publishes event for recurring task service.

    Args:
        task_id: The ID of the task to update
        user_id: The ID of the user updating the task (validated via JWT and path)
        db: Database session

    Returns:
        Updated TaskPublic object

    Raises:
        HTTPException: If task doesn't exist or doesn't belong to user
    """
    try:
        # Get task before update to check if it's recurring
        task_before = get_task_by_id_for_user(db=db, task_id=task_id, user_id=user_id)
        if not task_before:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or does not belong to user"
            )

        updated_task = toggle_task_completion_for_user(
            db=db,
            task_id=task_id,
            user_id=user_id
        )
        if not updated_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or does not belong to user"
            )

        # Cancel reminder if task is completed
        if updated_task.completed:
            await cancel_reminder(task_id)

        # If task was just completed and has recurring pattern, publish event
        if updated_task.completed and updated_task.recurring_pattern:
            await publish_task_updated(
                user_id=user_id,
                task_id=task_id,
                before={
                    "completed": task_before.completed,
                    "recurring_pattern": task_before.recurring_pattern,
                    "due_date": task_before.due_date.isoformat() if task_before.due_date else None
                },
                after={
                    "completed": updated_task.completed,
                    "recurring_pattern": updated_task.recurring_pattern,
                    "due_date": updated_task.due_date.isoformat() if updated_task.due_date else None
                },
                changed_fields=["completed"]
            )

        return updated_task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating task completion: {str(e)}"
        )