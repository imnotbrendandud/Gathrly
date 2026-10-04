import { useCallback } from 'react';

import { useAuthedFetch } from '@/hooks/use-authed-fetch';
import { fetchEvents, type EventScope } from '@/lib/events-api';

/** The signed-in user's events for one scope. */
export function useEvents(scope: EventScope) {
  const fetcher = useCallback((token: string) => fetchEvents(token, scope), [scope]);
  const { data, ...rest } = useAuthedFetch(fetcher);
  return { events: data, ...rest };
}
