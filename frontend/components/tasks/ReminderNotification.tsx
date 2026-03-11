'use client';

import { useEffect, useState } from 'react';
import {
  ExtendedNotificationOptions,
  areNotificationActionsSupported,
  areNotificationsAvailable,
  requestNotificationPermission,
  createNotification
} from '@/lib/notificationTypes';

interface ReminderNotificationProps {
  taskId: number;
  taskTitle: string;
  onSnooze?: (minutes: number) => void;
  onDismiss?: () => void;
}

export function ReminderNotification({
  taskId,
  taskTitle,
  onSnooze,
  onDismiss
}: ReminderNotificationProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showInApp, setShowInApp] = useState(false);

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const showNotification = async () => {
    // Request permission if needed
    const perm = await requestNotificationPermission();
    setPermission(perm);

    if (perm === 'granted') {
      // Build base notification options
      const baseOptions: NotificationOptions = {
        body: `Reminder: ${taskTitle}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `task-${taskId}`,
        requireInteraction: true
      };

      // Build extended options with actions if supported
      const options: ExtendedNotificationOptions = {
        ...baseOptions
      };

      // Only add actions if supported by the browser
      if (areNotificationActionsSupported()) {
        options.actions = [
          { action: 'snooze-10', title: 'Snooze 10 min' },
          { action: 'snooze-60', title: 'Snooze 1 hour' },
          { action: 'dismiss', title: 'Dismiss' }
        ];
      }

      // Create notification with proper type handling
      const notification = createNotification('Task Reminder', options);

      if (notification) {
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Note: Action buttons require Service Worker for full functionality
        // Show in-app notification as fallback for better UX
        setShowInApp(true);
      } else {
        // Fallback to in-app notification if browser notification failed
        setShowInApp(true);
      }
    } else {
      // Fallback to in-app notification if permission denied
      setShowInApp(true);
    }
  };

  const handleSnooze = (minutes: number) => {
    setShowInApp(false);
    if (onSnooze) {
      onSnooze(minutes);
    }
  };

  const handleDismiss = () => {
    setShowInApp(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Auto-show notification when component mounts
  useEffect(() => {
    showNotification();
  }, [taskId]);

  if (!showInApp) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-indigo-500 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">Task Reminder</h3>
            <p className="mt-1 text-sm text-gray-600 break-words">{taskTitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => handleSnooze(10)}
                className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
              >
                Snooze 10 min
              </button>
              <button
                onClick={() => handleSnooze(60)}
                className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
              >
                Snooze 1 hour
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to manage notification permissions
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  };

  return { permission, requestPermission, isAvailable: areNotificationsAvailable() };
}
