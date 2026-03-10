'use client';

import { useState, useEffect } from 'react';
import { EVENTS } from '@/lib/events';

export default function DebugPanel() {
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const logEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const timestamp = new Date().toLocaleTimeString();
      const eventType = e.type;
      const taskId = customEvent.detail?.taskId;

      setEventLog(prev => [
        `${timestamp}: ${eventType}${taskId ? ` (Task #${taskId})` : ''}`,
        ...prev.slice(0, 9)
      ]);
    };

    window.addEventListener(EVENTS.TASK_CREATED, logEvent);
    window.addEventListener(EVENTS.TASK_UPDATED, logEvent);
    window.addEventListener(EVENTS.TASK_DELETED, logEvent);
    window.addEventListener(EVENTS.TASK_COMPLETED, logEvent);
    window.addEventListener(EVENTS.TASKS_CHANGED, logEvent);

    return () => {
      window.removeEventListener(EVENTS.TASK_CREATED, logEvent);
      window.removeEventListener(EVENTS.TASK_UPDATED, logEvent);
      window.removeEventListener(EVENTS.TASK_DELETED, logEvent);
      window.removeEventListener(EVENTS.TASK_COMPLETED, logEvent);
      window.removeEventListener(EVENTS.TASKS_CHANGED, logEvent);
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-black text-white px-3 py-2 rounded-lg text-xs font-mono"
      >
        Show Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black text-white p-4 rounded-lg opacity-90 hover:opacity-100 transition-opacity max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">🔍 Event Log</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-xs"
        >
          Hide
        </button>
      </div>
      <ul className="text-xs font-mono space-y-1">
        {eventLog.length === 0 ? (
          <li className="text-gray-400">No events yet...</li>
        ) : (
          eventLog.map((log, i) => (
            <li key={i} className="text-green-400">{log}</li>
          ))
        )}
      </ul>
    </div>
  );
}
