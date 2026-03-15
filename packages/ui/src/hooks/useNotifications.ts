import { useState, useEffect, useCallback, useRef } from 'react';

export interface NotificationEvent {
  type: 'notification';
  title: string;
  body: string;
  category: 'cron' | 'approval' | 'task' | 'message' | 'agent';
  timestamp: string;
  actionUrl?: string;
}

export interface UseNotificationsResult {
  notifications: NotificationEvent[];
  clearAll: () => void;
}

export function useNotifications(serverUrl: string): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const permittedRef = useRef<boolean | null>(null);

  // Check notification permission on mount (Tauri only)
  useEffect(() => {
    (async () => {
      if (!(window as any).__TAURI_INTERNALS__) {
        permittedRef.current = false;
        return;
      }
      try {
        const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification');
        let permitted = await isPermissionGranted();
        if (!permitted) {
          const result = await requestPermission();
          permitted = result === 'granted';
        }
        permittedRef.current = permitted;
      } catch {
        permittedRef.current = false;
      }
    })();
  }, []);

  // SSE connection
  useEffect(() => {
    const url = `${serverUrl}/api/notifications/stream`;
    const es = new EventSource(url);

    es.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== 'notification') return;

        const notification = data as NotificationEvent;
        setNotifications(prev => [notification, ...prev].slice(0, 50));

        // OS notification when app not focused
        if (!document.hasFocus() && permittedRef.current) {
          try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('show_notification', {
              title: notification.title,
              body: notification.body,
            });
          } catch {
            // Tauri not available — toast will handle it
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      console.debug('[waggle] Notification SSE reconnecting...');
    };

    return () => es.close();
  }, [serverUrl]);

  const clearAll = useCallback(() => setNotifications([]), []);

  return { notifications, clearAll };
}
