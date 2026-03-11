'use client';

import { Task } from '@/lib/types';
import { useToggleTaskCompletion } from '@/lib/tasks-query';
import PriorityBadge from './PriorityBadge';
import TagChip from './TagChip';

interface TaskItemProps {
  task: Task;
  userId: string;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onToggleComplete?: (taskId: number, completed: boolean) => void; // Optional if handled via mutation inside
}

// Since TaskItem is used in TaskList which is used in TaskDashboard,
// and TaskDashboard provides the mutation handlers, we should use them.
// However, the user's snippet in the prompt showed:
// onDelete={(taskId) => deleteMutation.mutate(taskId)}
// which implies these are passed down.

export function TaskItem({ task, userId, onEdit, onDelete }: TaskItemProps) {
  const toggleMutation = useToggleTaskCompletion();

  // 🎯 DEBUG: Log task data to verify what we're receiving
  console.log('🎯 Rendering task:', {
    id: task.id,
    title: task.title,
    priority: task.priority,
    tags: task.tags,
    hasPriority: !!task.priority,
    hasTags: (task.tags?.length ?? 0) > 0,
    priorityType: typeof task.priority,
    tagsType: typeof task.tags,
    rawTask: task
  });

  const handleToggle = () => {
    toggleMutation.mutate({
      user_id: userId,
      task_id: task.id,
      completed: !task.completed
    });
  };

  // Check if task is overdue
  const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < new Date();

  // Normalize priority - handle null/undefined/missing values
  const taskPriority = (task.priority || 'medium') as 'low' | 'medium' | 'high';

  // Normalize tags - handle null/undefined/missing values
  const taskTags = task.tags || [];

  return (
    <div
      className={`group flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
        task.completed
          ? 'bg-green-50 border-green-200 shadow-sm'
          : isOverdue
          ? 'bg-red-50 border-red-300 hover:border-red-400 hover:shadow-md'
          : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <button
          onClick={handleToggle}
          disabled={toggleMutation.isPending}
          className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            task.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 text-transparent hover:border-green-500 hover:text-green-200'
          }`}
        >
          {task.completed && (
            <svg className="h-4 w-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {!task.completed && <div className="h-4 w-4" />}
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-sm font-medium truncate ${
                task.completed ? 'text-green-800 line-through' : isOverdue ? 'text-red-800' : 'text-gray-900'
              }`}
            >
              {task.title}
            </h3>
            {/* ALWAYS show priority badge - use normalized value */}
            <PriorityBadge priority={taskPriority} />
            {isOverdue && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                OVERDUE
              </span>
            )}
            {task.recurring_pattern && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {task.recurring_pattern}
              </span>
            )}
            {task.parent_task_id && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                Recurring #{task.parent_task_id}
              </span>
            )}
          </div>
          {task.description && (
            <p
              className={`text-xs truncate ${
                task.completed ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {task.description}
            </p>
          )}
          {(task.due_date || task.remind_at) && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {task.due_date && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Due: {new Date(task.due_date).toLocaleString()}
                </span>
              )}
              {task.remind_at && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Reminder: {new Date(task.remind_at).toLocaleString()}
                </span>
              )}
            </div>
          )}
          {/* ALWAYS show tags section - use normalized value */}
          {taskTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {taskTags.map((tag) => (
                <TagChip key={tag} tag={tag} className="text-xs" />
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">No tags</div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
          title="Edit task"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
          title="Delete task"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
