// frontend/hooks/useTaskRefresh.ts
import { useEffect, useCallback, useState } from 'react';
import { EVENTS } from '@/lib/events';

export const useTaskRefresh = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastEvent, setLastEvent] = useState<{type: string, detail: any} | null>(null);

  const refreshTasks = useCallback(() => {
    console.log('🔄 REFRESHING TASKS - Key:', refreshKey);
    setRefreshKey(prev => prev + 1);
  }, [refreshKey]);

  const handleTaskEvent = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    console.log(`📡 EVENT RECEIVED: ${event.type}`, customEvent.detail);
    setLastEvent({ type: event.type, detail: customEvent.detail });
    refreshTasks();
  }, [refreshTasks]);

  useEffect(() => {
    console.log('🔌 Setting up event listeners');

    // Listen to all task events
    window.addEventListener(EVENTS.TASK_CREATED, handleTaskEvent);
    window.addEventListener(EVENTS.TASK_UPDATED, handleTaskEvent);
    window.addEventListener(EVENTS.TASK_DELETED, handleTaskEvent);
    window.addEventListener(EVENTS.TASK_COMPLETED, handleTaskEvent);
    window.addEventListener(EVENTS.TASKS_CHANGED, handleTaskEvent);

    // Cleanup
    return () => {
      console.log('🔌 Removing event listeners');
      window.removeEventListener(EVENTS.TASK_CREATED, handleTaskEvent);
      window.removeEventListener(EVENTS.TASK_UPDATED, handleTaskEvent);
      window.removeEventListener(EVENTS.TASK_DELETED, handleTaskEvent);
      window.removeEventListener(EVENTS.TASK_COMPLETED, handleTaskEvent);
      window.removeEventListener(EVENTS.TASKS_CHANGED, handleTaskEvent);
    };
  }, [handleTaskEvent]);

  return { refreshKey, lastEvent, refreshTasks };
};
