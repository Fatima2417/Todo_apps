"""
Quick script to fix old tasks that don't have priority and tags values.
Run this once to update existing tasks in the database.
"""
import asyncio
from sqlmodel import Session, select
from src.database import engine
from src.models.task import Task, TaskPriority

def fix_old_tasks():
    """Update old tasks with default values for new fields"""
    with Session(engine) as session:
        # Get all tasks
        statement = select(Task)
        tasks = session.exec(statement).all()

        updated_count = 0
        for task in tasks:
            needs_update = False

            # Fix priority if NULL
            if task.priority is None:
                task.priority = TaskPriority.MEDIUM
                needs_update = True
                print(f"Task {task.id} '{task.title}': Set priority to MEDIUM")

            # Fix tags if NULL
            if task.tags is None:
                task.tags = []
                needs_update = True
                print(f"Task {task.id} '{task.title}': Set tags to empty array")

            if needs_update:
                session.add(task)
                updated_count += 1

        if updated_count > 0:
            session.commit()
            print(f"\n✅ Updated {updated_count} tasks successfully!")
        else:
            print("✅ All tasks already have proper values!")

if __name__ == "__main__":
    print("Fixing old tasks in database...\n")
    fix_old_tasks()
