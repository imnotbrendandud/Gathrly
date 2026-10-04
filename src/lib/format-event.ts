import type { EventSummary } from '@/lib/events-api';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Shown for a draft's missing date or place. */
export const TO_BE_DECIDED = 'TBD';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** "6pm", or "4:30pm" when it is not on the hour. */
function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0 ? `${hour12}${suffix}` : `${hour12}:${String(minutes).padStart(2, '0')}${suffix}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The date line on an event card, in the device's timezone:
 *   today / tomorrow / yesterday → "Today at 6pm"
 *   within the next 6 days       → "Wed at 6pm"
 *   the week after               → "Next Sun at 4pm"
 *   within the last 6 days       → "Last Tue at 6pm"
 *   anything else                → "Sat 08/08 at 4pm" (year added when it is not this one)
 */
export function formatEventDate(startsAt: string | null, now: Date = new Date()): string {
  if (!startsAt) return TO_BE_DECIDED;

  const start = new Date(startsAt);
  const time = formatTime(start);
  const weekday = WEEKDAYS[start.getDay()];
  // Rounded so a daylight-saving change (23 or 25 hour day) cannot shift the count.
  const daysAway = Math.round((startOfDay(start).getTime() - startOfDay(now).getTime()) / MS_PER_DAY);

  if (daysAway === 0) return `Today at ${time}`;
  if (daysAway === 1) return `Tomorrow at ${time}`;
  if (daysAway === -1) return `Yesterday at ${time}`;
  if (daysAway >= 2 && daysAway <= 6) return `${weekday} at ${time}`;
  if (daysAway >= 7 && daysAway <= 13) return `Next ${weekday} at ${time}`;
  if (daysAway >= -6 && daysAway <= -2) return `Last ${weekday} at ${time}`;

  const date = `${pad(start.getMonth() + 1)}/${pad(start.getDate())}`;
  const year = start.getFullYear() === now.getFullYear() ? '' : `/${String(start.getFullYear()).slice(-2)}`;
  return `${weekday} ${date}${year} at ${time}`;
}

/** "Oct 20" */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** "18 of 24 Going", or "18 Going" with no cap. */
export function formatGoingCount(event: EventSummary): string {
  return event.capacity === null
    ? `${event.goingCount} Going`
    : `${event.goingCount} of ${event.capacity} Going`;
}

export type RsvpChip = { label: string; tone: 'success' | 'neutral' };

/** The pill on a card for an event you're invited to: your answer so far. */
export function getRsvpChip(event: EventSummary): RsvpChip | null {
  switch (event.myRsvp) {
    case 'going':
      return { label: 'Going', tone: 'success' };
    case 'maybe':
      return { label: 'Maybe', tone: 'neutral' };
    case 'invited':
      return { label: 'Invited', tone: 'neutral' };
    default:
      return null;
  }
}

/**
 * "Confirm by Oct 20" when you still owe the host a final answer (you haven't
 * replied, or said maybe) and they set a deadline. Null otherwise.
 */
export function getConfirmBy(event: EventSummary): string | null {
  if (event.role !== 'attending' || event.myRsvp === 'going' || !event.rsvpDeadline) return null;
  return `Confirm by ${formatShortDate(event.rsvpDeadline)}`;
}
