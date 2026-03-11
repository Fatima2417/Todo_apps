/**
 * Extended Notification Types
 *
 * Provides type-safe definitions for browser notification features
 * that may not be fully standardized across all browsers.
 */

/**
 * Notification action button configuration
 */
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

/**
 * Extended NotificationOptions that includes experimental/non-standard properties
 * like actions, which are supported in some browsers but not in the standard TypeScript definitions.
 */
export interface ExtendedNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  dir?: NotificationDirection;
  lang?: string;
  silent?: boolean;
  actions?: NotificationAction[];
  vibrate?: number | number[];
  renotify?: boolean;
}

/**
 * Check if the browser supports notification actions
 *
 * @returns true if actions are supported, false otherwise
 */
export function areNotificationActionsSupported(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  // Check if actions property exists in Notification prototype
  return 'actions' in Notification.prototype;
}

/**
 * Check if notifications are supported and permission is granted
 *
 * @returns true if notifications are available and permitted
 */
export function areNotificationsAvailable(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  return Notification.permission === 'granted';
}

/**
 * Request notification permission from the user
 *
 * @returns Promise resolving to the permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  return await Notification.requestPermission();
}

/**
 * Create a notification with proper type safety
 *
 * @param title - Notification title
 * @param options - Extended notification options
 * @returns Notification instance or null if not supported
 */
export function createNotification(
  title: string,
  options: ExtendedNotificationOptions
): Notification | null {
  if (!areNotificationsAvailable()) {
    console.warn('Notifications are not available or not permitted');
    return null;
  }

  try {
    // If actions are not supported, remove them from options
    if (!areNotificationActionsSupported() && options.actions) {
      console.log('Notification actions not supported, creating notification without actions');
      const { actions, ...optionsWithoutActions } = options;
      return new Notification(title, optionsWithoutActions);
    }

    // Cast to any to bypass TypeScript checking for experimental features
    return new Notification(title, options as any);
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}
