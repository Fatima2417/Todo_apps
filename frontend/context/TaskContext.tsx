'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Task } from '@/lib/types';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
  addTaskToContext: (task: Task) => void;
  updateTaskInContext: (task: Task) => void;
  deleteTaskFromContext: (taskId: number) => void;
  toggleTaskInContext: (taskId: number, completed: boolean) => void;
  setTasksFromQuery: (tasks: Task[]) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

interface TaskProviderProps {
  children: ReactNode;
  userId: string;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children, userId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh tasks from API
  const refreshTasks = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const authData = localStorage.getItem('todo-app-auth');
      const token = authData ? JSON.parse(authData).token : null;

      const response = await fetch(`${apiUrl}/api/v1/${userId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data);
      console.log('🔄 Tasks refreshed from API:', data.length, 'tasks');
    } catch (err: any) {
      console.error('Error refreshing tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Set tasks from React Query (used by TaskDashboard)
  const setTasksFromQuery = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
  }, []);

  // Add task to local state immediately (optimistic update)
  const addTaskToContext = useCallback((task: Task) => {
    setTasks(prev => {
      // Check if task already exists
      if (prev.some(t => t.id === task.id)) {
        console.log('⚠️ Task already exists, skipping add:', task.id);
        return prev;
      }
      console.log('➕ Adding task to context:', task.id, task.title);
      return [task, ...prev];
    });
  }, []);

  // Update task in local state immediately
  const updateTaskInContext = useCallback((updatedTask: Task) => {
    setTasks(prev => {
      const updated = prev.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      );
      console.log('✏️ Updating task in context:', updatedTask.id, updatedTask.title);
      return updated;
    });
  }, []);

  // Delete task from local state immediately
  const deleteTaskFromContext = useCallback((taskId: number) => {
    setTasks(prev => {
      const filtered = prev.filter(task => task.id !== taskId);
      console.log('🗑️ Deleting task from context:', taskId);
      return filtered;
    });
  }, []);

  // Toggle task completion in local state immediately
  const toggleTaskInContext = useCallback((taskId: number, completed: boolean) => {
    setTasks(prev => {
      const updated = prev.map(task =>
        task.id === taskId ? { ...task, completed } : task
      );
      console.log('✅ Toggling task in context:', taskId, 'completed:', completed);
      return updated;
    });
  }, []);

  const value: TaskContextType = {
    tasks,
    loading,
    error,
    refreshTasks,
    addTaskToContext,
    updateTaskInContext,
    deleteTaskFromContext,
    toggleTaskInContext,
    setTasksFromQuery
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
