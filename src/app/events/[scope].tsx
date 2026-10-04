import { Redirect, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DetachedNavBar } from '@/components/bottom-nav';
import { EventList } from '@/components/home/event-list';
import { FilterChip } from '@/components/home/filter-chip';
import { SearchBar } from '@/components/search-bar';
import { TitleBar } from '@/components/title-bar';
import { Brand } from '@/constants/theme';
import { useEvents } from '@/hooks/use-events';
import type { EventScope, EventSummary } from '@/lib/events-api';

type PastFilter = 'all' | 'hosted' | 'attended';

const PAST_FILTERS: { key: PastFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hosted', label: 'Hosted' },
  { key: 'attended', label: 'Attended' },
];

type Copy = { title: string; message: string };

/** Empty states from the designs. Past Events has one per filter. */
const PAST_EMPTY: Record<PastFilter, Copy> = {
  all: {
    title: 'No Past Events Yet',
    message: 'Events you host or attend will appear here after they happen.',
  },
  hosted: {
    title: 'No Hosted Events Yet',
    message: 'Events you host will appear here after they happen.',
  },
  attended: {
    title: 'No Attended Events Yet',
    message: 'Events you attend as a guest will appear here after they happen.',
  },
};

const DRAFTS_EMPTY: Copy = {
  title: 'No Saved Drafts Yet',
  message: 'Save an unfinished event and come back to finish it whenever you’re ready.',
};

const TITLES: Partial<Record<EventScope, string>> = {
  past: 'Past Events',
  drafts: 'Drafts',
};

/** Case-insensitive match on the title or the place. */
function matchesSearch(event: EventSummary, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [event.title, event.location].some((field) => field?.toLowerCase().includes(needle));
}

/** Past Events and Drafts, opened from the buttons on Home. */
export default function EventsByScopeScreen() {
  const { scope } = useLocalSearchParams<{ scope: string }>();
  const title = TITLES[scope as EventScope];

  if (!title) return <Redirect href="/home" />;
  return <EventsScreen scope={scope as 'past' | 'drafts'} title={title} />;
}

function EventsScreen({ scope, title }: { scope: 'past' | 'drafts'; title: string }) {
  const { events, error, isRefreshing, refresh, retry } = useEvents(scope);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PastFilter>('all');
  const isPast = scope === 'past';

  const visibleEvents = useMemo(() => {
    if (events === null) return null;
    return events.filter((event) => {
      if (isPast && filter === 'hosted' && event.role !== 'hosting') return false;
      if (isPast && filter === 'attended' && event.role !== 'attending') return false;
      return matchesSearch(event, query);
    });
  }, [events, isPast, filter, query]);

  // A search with no hits says so, rather than claiming there is nothing at all.
  const empty: Copy = query.trim()
    ? { title: 'No Matching Events', message: `Nothing matches “${query.trim()}”.` }
    : isPast
      ? PAST_EMPTY[filter]
      : DRAFTS_EMPTY;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <TitleBar title={title} />

          <View style={styles.filterActions}>
            <SearchBar value={query} onChangeText={setQuery} />

            {isPast ? (
              <View style={styles.chips}>
                {PAST_FILTERS.map(({ key, label }) => (
                  <FilterChip
                    key={key}
                    label={label}
                    selected={filter === key}
                    onPress={() => setFilter(key)}
                  />
                ))}
              </View>
            ) : null}

            <EventList
              events={visibleEvents}
              variant={isPast ? 'past' : 'draft'}
              error={error}
              onRetry={retry}
              emptyTitle={empty.title}
              emptyMessage={empty.message}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <DetachedNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.pageBackground,
  },
  body: {
    flex: 1,
  },
  content: {
    // Grows to fill the screen so an empty state can center itself in the room left.
    flexGrow: 1,
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  filterActions: {
    flex: 1,
    gap: 16,
  },
  chips: {
    flexDirection: 'row',
    gap: 12,
  },
});
