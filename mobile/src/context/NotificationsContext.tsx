import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { notificationsApi } from '@/lib/api';

const REFRESH_EVERY_MS = 30000;

interface NotificationsContextValue {
  unreadCount: number;
  refreshUnread: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({ unreadCount: 0, refreshUnread: () => {} });

/**
 * Keeps the unread-notification count for the bell in the header.
 * Notifications are only for students (claims and reports), so nothing is fetched for admins.
 * The count is refreshed when the user logs in, every 30 seconds while the app is open,
 * when the app comes back to the foreground, and whenever a screen calls refreshUnread().
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const isStudent = user?.role === 'STUDENT';

  const refreshUnread = useCallback(() => {
    if (!isStudent) return;
    notificationsApi
      .list()
      .then((result) => setUnreadCount(result.unreadCount))
      .catch(() => {}); // the bell simply keeps its last number if the server cannot be reached
  }, [isStudent]);

  useEffect(() => {
    if (!isStudent) return;
    refreshUnread();
    const timer = setInterval(refreshUnread, REFRESH_EVERY_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshUnread();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [isStudent, refreshUnread]);

  return (
    <NotificationsContext.Provider value={{ unreadCount: isStudent ? unreadCount : 0, refreshUnread }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
