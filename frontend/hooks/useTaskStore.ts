// frontend/hooks/useTaskStore.ts
import { useState, useEffect } from 'react';
import taskStore, { Task } from '@/lib/taskStore';

export function useTaskStore(userId?: string) {
  const [state, setState] = useState(taskStore.getState());

  useEffect(() => {
    console.log('🔌 useTaskStore: Setting up subscription');

    // Set user ID if provided
    if (userId) {
      taskStore.setUserId(userId);
      // Initial fetch
      taskStore.fetchTasks();
    }

    // Subscribe to store changes
    const unsubscribe = taskStore.subscribe(() => {
      console.log('🔔 useTaskStore: Store changed, updating component');
      setState(taskStore.getState());
    });

    return () => {
      console.log('🔌 useTaskStore: Cleaning up subscription');
      unsubscribe();
    };
  }, [userId]);

  return {
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    refreshTasks: () => taskStore.forceRefresh(),
    addTask: (task: Task) => taskStore.addTask(task),
    updateTask: (task: Task) => taskStore.updateTask(task),
    deleteTask: (taskId: number) => taskStore.deleteTask(taskId)
  };
}
