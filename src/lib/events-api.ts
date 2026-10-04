import { apiRequest } from '@/lib/api';

export type EventScope = 'upcoming' | 'past' | 'drafts';

/** `GET /v1/events` row — see backend/src/routes/events.js. */
export type EventSummary = {
  id: string;
  title: string;
  location: string | null;
  /** ISO timestamp. Null only for drafts. */
  startsAt: string | null;
  /** Null means no cap on guests. */
  capacity: number | null;
  rsvpDeadline: string | null;
  status: 'draft' | 'published' | 'cancelled';
  /** The signed-in user's relationship to the event. */
  role: 'hosting' | 'attending';
  /** Display name of whoever is hosting. */
  hostName: string;
  /** The user's own RSVP; null when hosting. */
  myRsvp: 'invited' | 'going' | 'maybe' | null;
  goingCount: number;
};

/** Events the user hosts or was invited to, soonest first (drafts: last edited first). */
export async function fetchEvents(token: string, scope: EventScope = 'upcoming') {
  const { events } = await apiRequest<{ events: EventSummary[] }>(`/v1/events?scope=${scope}`, {
    token,
  });
  return events;
}
