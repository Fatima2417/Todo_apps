from sqlmodel import Session
from typing import List, Optional

from ..repositories import task_repository as repo
from ..schemas.task import TaskCreate, TaskUpdate, TaskPublic


def create_task_for_user_service(*, db: Session, user_id: str, task_data: TaskCreate) -> TaskPublic:
    """
    Service function to create a new task for a user.
    Orchestrates the business logic for task creation.
    """
    # Add any business logic here if needed
    # For example: check if user has reached task limit, etc.

    # Call the repository function to create the task
    task = repo.create_task_for_user(db=db, user_id=user_id, task_data=task_data)
    return task


def get_tasks_for_user_service(
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
) -> List[TaskPublic]:
    """
    Service function to get all tasks for a user.
    Orchestrates the business logic for task retrieval.
    """
    # Add any business logic here if needed
    # For example: pagination, sorting, etc.

    # Call the repository function to get tasks
    tasks = repo.get_tasks_for_user(
        db=db,
        user_id=user_id,
        completed_filter=completed_filter,
        priority_filter=priority_filter,
        tags_filter=tags_filter,
        search_query=search_query,
        due_date_from=due_date_from,
        due_date_to=due_date_to,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return tasks


def get_task_by_id_for_user_service(*, db: Session, task_id: int, user_id: str) -> Optional[TaskPublic]:
    """
    Service function to get a specific task for a user by ID.
    Orchestrates the business logic for task retrieval.
    """
    # Add any business logic here if needed

    # Call the repository function to get the task
    task = repo.get_task_by_id_for_user(db=db, task_id=task_id, user_id=user_id)
    return task


def update_task_for_user_service(*, db: Session, task_id: int, user_id: str, task_update: TaskUpdate) -> Optional[TaskPublic]:
    """
    Service function to update a specific task for a user.
    Orchestrates the business logic for task updates.
    """
    # Add any business logic here if needed
    # For example: check if task can be modified, update audit fields, etc.

    # Call the repository function to update the task
    updated_task = repo.update_task_for_user(db=db, task_id=task_id, user_id=user_id, task_update=task_update)
    return updated_task


def delete_task_for_user_service(*, db: Session, task_id: int, user_id: str) -> bool:
    """
    Service function to delete a specific task for a user.
    Orchestrates the business logic for task deletion.
    """
    # Add any business logic here if needed
    # For example: check if task can be deleted, update related entities, etc.

    # Call the repository function to delete the task
    success = repo.delete_task_for_user(db=db, task_id=task_id, user_id=user_id)
    return success


# Aliases to match the import in the routes
create_task_for_user = create_task_for_user_service
get_tasks_for_user = get_tasks_for_user_service
get_task_by_id_for_user = get_task_by_id_for_user_service
update_task_for_user = update_task_for_user_service
delete_task_for_user = delete_task_for_user_service

# Additional function for toggle_task_completion
def toggle_task_completion_for_user_service(*, db: Session, task_id: int, user_id: str) -> Optional[TaskPublic]:
    """
    Service function to toggle the completion status of a task for a user.
    """
    # Get the current task to check its completion status
    current_task = repo.get_task_by_id_for_user(db=db, task_id=task_id, user_id=user_id)
    if not current_task:
        return None

    # Prepare update data with the opposite of current completion status
    task_update = TaskUpdate(completed=not current_task.completed)

    # Update the task
    updated_task = repo.update_task_for_user(
        db=db,
        task_id=task_id,
        user_id=user_id,
        task_update=task_update
    )

    return updated_task

toggle_task_completion_for_user = toggle_task_completion_for_user_service


def get_user_tags_service(*, db: Session, user_id: str) -> List[str]:
    """
    Service function to get all unique tags used by a user.
    """
    tags = repo.get_user_tags(db=db, user_id=user_id)
    return tags

get_user_tags = get_user_tags_service