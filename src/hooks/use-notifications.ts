import { useEffect } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { useAuthedFetch } from '@/hooks/use-authed-fetch';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
} from '@/lib/notifications-api';

/**
 * The user's notifications. Opening the screen counts as reading them, so once
 * they have loaded anything unread is marked read on the server; the bell on
 * Home picks that up the next time it is focused.
 */
export function useNotifications() {
  const { token } = useAuth();
  const { data, ...rest } = useAuthedFetch(fetchNotifications);

  const hasUnread = data?.some((notification) => !notification.read) ?? false;
  useEffect(() => {
    if (!token || !hasUnread) return;
    // Best effort: a failure only leaves the bell's dot on a little longer.
    markAllNotificationsRead(token).catch(() => {});
  }, [token, hasUnread]);

  return { notifications: data, ...rest };
}

/** How many notifications are unread — drives the dot on the bell. */
export function useUnreadCount() {
  const { data } = useAuthedFetch(fetchUnreadCount);
  return data ?? 0;
}
