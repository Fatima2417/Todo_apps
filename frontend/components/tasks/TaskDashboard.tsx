'use client';

import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleTaskCompletion
} from '@/lib/tasks-query';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import { useTaskStore } from '@/hooks/useTaskStore';
import taskStore from '@/lib/taskStore';

interface TaskDashboardProps {
  userId: string;
}

export function TaskDashboard({ userId }: TaskDashboardProps) {
  const { data: tasks, isLoading, error } = useTasks(userId);
  // No store sync needed - React Query is the single source of truth

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const toggleTaskMutation = useToggleTaskCompletion();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[],
    due_date: '',
    remind_at: '',
    recurring_pattern: ''
  });

  // Helper function: Convert ISO date to datetime-local format (YYYY-MM-DDTHH:MM)
  const isoToDatetimeLocal = (isoString: string | null): string => {
    if (!isoString) return '';
    try {
      // Remove milliseconds and Z, keep YYYY-MM-DDTHH:MM:SS format
      const date = new Date(isoString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      console.error('Error converting ISO to datetime-local:', e);
      return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (tags: string[]) => {
    setFormValues(prev => ({ ...prev, tags }));
  };

  const handleSaveTask = async () => {
    setErrorMessage('');

    // 📝 Convert datetime-local format to ISO format for backend
    const preparedData = {
      title: formValues.title,
      description: formValues.description || undefined,
      priority: formValues.priority,
      tags: formValues.tags,
      // Convert datetime-local (YYYY-MM-DDTHH:MM) to ISO (YYYY-MM-DDTHH:MM:SS.sssZ)
      due_date: formValues.due_date ? new Date(formValues.due_date).toISOString() : undefined,
      remind_at: formValues.remind_at ? new Date(formValues.remind_at).toISOString() : undefined,
      recurring_pattern: formValues.recurring_pattern || undefined
    };

    console.log('📤 Saving task with data:', {
      original: formValues,
      prepared: preparedData
    });

    try {
      if (editTask) {
        const result = await updateTaskMutation.mutateAsync({
          user_id: userId,
          task_id: editTask.id,
          taskData: preparedData
        });
        console.log('✅ Task updated, backend returned:', result);
        // React Query auto-invalidates cache (see tasks-query.ts line 168)
      } else {
        const result = await createTaskMutation.mutateAsync({
          user_id: userId,
          taskData: preparedData
        });
        console.log('✅ Task created, backend returned:', result);
        // React Query auto-invalidates cache (see tasks-query.ts line 123)
      }
      // Only close and reset if successful (mutateAsync throws if it fails)
      handleCancelForm();
    } catch (err: any) {
      console.error('Error saving task:', err);

      // Parse user-friendly error messages
      const errorStr = err?.message || String(err);

      if (errorStr.includes('Reminder must be before due date') || errorStr.includes('chk_remind_before_due')) {
        setErrorMessage('⚠️ The reminder time must be set before the due date. Please adjust your reminder time to be earlier than the due date.');
      } else if (errorStr.includes('remind_at')) {
        setErrorMessage('⚠️ There is an issue with the reminder time. Please make sure it is set before the due date.');
      } else if (errorStr.includes('due_date')) {
        setErrorMessage('⚠️ There is an issue with the due date. Please check the date format.');
      } else {
        setErrorMessage(`⚠️ Failed to save task. Please check your input and try again.`);
      }

      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTaskMutation.mutateAsync({ user_id: userId, task_id: taskId });
      // React Query auto-invalidates cache (see tasks-query.ts line 256)
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleToggleComplete = async (taskId: number, completed: boolean) => {
    try {
      await toggleTaskMutation.mutateAsync({
        user_id: userId,
        task_id: taskId,
        completed
      });
      // React Query auto-invalidates cache (see tasks-query.ts line 220)
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditTask(task);
    setFormValues({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      tags: task.tags || [],
      due_date: isoToDatetimeLocal(task.due_date),
      remind_at: isoToDatetimeLocal(task.remind_at),
      recurring_pattern: task.recurring_pattern || ''
    });
    setShowTaskForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowTaskForm(false);
    setEditTask(null);
    setErrorMessage('');
    setFormValues({
      title: '',
      description: '',
      priority: 'medium',
      tags: [],
      due_date: '',
      remind_at: '',
      recurring_pattern: ''
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <button
          onClick={() => {
            if (showTaskForm) {
              handleCancelForm();
            } else {
              setShowTaskForm(true);
            }
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showTaskForm ? 'Cancel' : 'Add New Task'}
        </button>
      </div>

      {showTaskForm && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {editTask ? 'Edit Task' : 'Create New Task'}
          </h2>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          <TaskForm
            task={editTask || undefined}
            onSave={handleSaveTask}
            onCancel={handleCancelForm}
            isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
            userId={userId}
            value={formValues}
            onChange={handleInputChange}
            onTagsChange={handleTagsChange}
          />
          {(createTaskMutation.isError || updateTaskMutation.isError) && (
            <p className="mt-2 text-red-600 text-sm">
              Error saving task: {((createTaskMutation.error || updateTaskMutation.error) as Error)?.message}
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-600 font-medium">Error loading tasks: {(error as Error).message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-indigo-600 hover:text-indigo-500 underline"
          >
            Retry
          </button>
        </div>
      ) : tasks && tasks.length > 0 ? (
        <TaskList
          tasks={tasks}
          userId={userId}
          loading={isLoading}
          error={null}
          onTaskUpdate={handleEditTask}
          onTaskDelete={handleDeleteTask}
        />
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowTaskForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create your first task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
