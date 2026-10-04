import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { EventCard, type EventCardVariant } from '@/components/home/event-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/state-panels';
import type { EventSummary } from '@/lib/events-api';

type EventListProps = {
  /** Null until the first load finishes. */
  events: EventSummary[] | null;
  /** Which card layout to use. */
  variant: EventCardVariant;
  error: unknown;
  onRetry: () => void;
  emptyTitle: string;
  emptyMessage: string;
  /** A button under the empty message, e.g. "Create an event". */
  emptyAction?: ComponentProps<typeof EmptyState>['action'];
};

/** The stack of event cards, or a loading / error / empty state in its place. */
export function EventList({
  events,
  variant,
  error,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyAction,
}: EventListProps) {
  // Keep showing what we have if a refresh fails; only replace the list when
  // there is nothing to show yet.
  if (events === null && error !== null) {
    return <ErrorState title="Couldn’t load events" error={error} onRetry={onRetry} />;
  }
  if (events === null) return <LoadingState />;
  if (events.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }

  return (
    <View style={variant === 'upcoming' ? styles.homeList : styles.list}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} variant={variant} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  homeList: {
    gap: 12,
  },
  // Past Events and Drafts stack their cards tighter.
  list: {
    gap: 8,
  },
});
