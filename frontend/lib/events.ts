// frontend/lib/events.ts
export const EVENTS = {
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_COMPLETED: 'task:completed',
  TASKS_CHANGED: 'tasks:changed' // Generic event for any change
} as const;

// Helper to dispatch events
export const dispatchTaskEvent = (type: string, taskId?: number) => {
  console.log(`📢 DISPATCHING EVENT: ${type}`, { taskId });
  window.dispatchEvent(new CustomEvent(type, {
    detail: { taskId, timestamp: Date.now() }
  }));
  // Also dispatch generic event
  window.dispatchEvent(new CustomEvent(EVENTS.TASKS_CHANGED, {
    detail: { taskId, timestamp: Date.now() }
  }));
};
