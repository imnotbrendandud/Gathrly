import { apiRequest } from '@/lib/api';

/** `GET /v1/notifications` row — see backend/src/routes/notifications.js. */
export type NotificationItem = {
  id: string;
  /** rsvp_response: someone answered an invite to your event. invite: you were invited. */
  type: 'rsvp_response' | 'invite';
  /** Only for rsvp_response. */
  response: 'yes' | 'maybe' | 'no' | null;
  /** Who did it. */
  actorName: string;
  eventId: string;
  eventTitle: string;
  /** ISO timestamp. */
  createdAt: string;
  read: boolean;
};

/** The user's notifications, newest first. */
export async function fetchNotifications(token: string) {
  const { notifications } = await apiRequest<{ notifications: NotificationItem[] }>(
    '/v1/notifications',
    { token }
  );
  return notifications;
}

export async function fetchUnreadCount(token: string) {
  const { count } = await apiRequest<{ count: number }>('/v1/notifications/unread-count', { token });
  return count;
}

export function markAllNotificationsRead(token: string) {
  return apiRequest<{ ok: true }>('/v1/notifications/read', { method: 'POST', token });
}
