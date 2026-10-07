import type { NotificationItem } from '@/lib/notifications-api';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole calendar days between `date` and `now` (0 = same day). Rounded so daylight saving cannot shift it. */
function calendarDaysAgo(date: Date, now: Date) {
  return Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY);
}

/**
 * The small grey age next to a notification:
 * "now", "30m", "2h", "1d" … "6d", then a date ("08/12/26") from a week on.
 */
export function formatRelativeTime(createdAt: string, now: Date = new Date()): string {
  const date = new Date(createdAt);
  const elapsed = Math.max(0, now.getTime() - date.getTime());

  if (elapsed < MINUTE) return 'now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;

  if (calendarDaysAgo(date, now) >= 7) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  }
  return `${Math.max(1, Math.floor(elapsed / DAY))}d`;
}

export type NotificationSection = {
  title: 'Today' | 'This Week' | 'Older';
  items: NotificationItem[];
};

/** Splits (already newest-first) notifications into Today / This Week / Older, dropping empty sections. */
export function groupNotifications(
  notifications: NotificationItem[],
  now: Date = new Date()
): NotificationSection[] {
  const sections: NotificationSection[] = [
    { title: 'Today', items: [] },
    { title: 'This Week', items: [] },
    { title: 'Older', items: [] },
  ];

  for (const notification of notifications) {
    const days = calendarDaysAgo(new Date(notification.createdAt), now);
    const index = days <= 0 ? 0 : days < 7 ? 1 : 2;
    sections[index].items.push(notification);
  }

  return sections.filter((section) => section.items.length > 0);
}
