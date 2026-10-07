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

export type EventVisibility = 'private' | 'public';

/** What the Create Event form sends. Timestamps are ISO strings. */
export type EventInput = {
  title: string | null;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  /** Short name shown on cards ("Natalie's Apartment"). */
  location: string | null;
  /** Full address under it. */
  address: string | null;
  visibility: EventVisibility;
  contributionsEnabled: boolean;
  plusOnes: number;
  requirePlusOneNames: boolean;
  rsvpDeadline: string | null;
  status: 'draft' | 'published';
};

/** `eventDetail()` in backend/src/routes/events.js. */
export type EventDetail = Omit<EventInput, 'title' | 'status'> & {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'cancelled';
  createdAt: string;
  updatedAt: string;
};

/** Publish a new event, or save it as a draft. */
export async function createEvent(token: string, input: EventInput) {
  const { event } = await apiRequest<{ event: EventDetail }>('/v1/events', {
    method: 'POST',
    body: input,
    token,
  });
  return event;
}

/** One of your own events, e.g. a draft to reopen. */
export async function fetchEvent(token: string, id: string) {
  const { event } = await apiRequest<{ event: EventDetail }>(`/v1/events/${id}`, { token });
  return event;
}

/** Save a draft again, or publish it with `status: 'published'`. */
export async function updateDraft(token: string, id: string, input: EventInput) {
  const { event } = await apiRequest<{ event: EventDetail }>(`/v1/events/${id}`, {
    method: 'PUT',
    body: input,
    token,
  });
  return event;
}
