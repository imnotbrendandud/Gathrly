import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/home/action-button';
import { EventList } from '@/components/home/event-list';
import { FilterChip } from '@/components/home/filter-chip';
import { Brand } from '@/constants/theme';
import { useEvents } from '@/hooks/use-events';
import { useUnreadCount } from '@/hooks/use-notifications';

type Filter = 'all' | 'hosting' | 'attending';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hosting', label: 'Hosting' },
  { key: 'attending', label: 'Attending' },
];

/** What to show when a filter has no events. Only the ones you could act on offer a Create button. */
const EMPTY_STATE: Record<Filter, { title: string; message: string; canCreate: boolean }> = {
  all: {
    title: 'Nothing Planned yet!',
    message: 'You don’t have any upcoming events yet. Create one to get started.',
    canCreate: true,
  },
  hosting: {
    title: 'Nothing Planned yet!',
    message: 'You don’t have any upcoming events yet. Create one to get started.',
    canCreate: true,
  },
  attending: {
    title: 'No Events to Attend',
    message: 'You don’t have any upcoming events from other hosts.',
    canCreate: false,
  },
};

export default function HomeScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const { events, error, isRefreshing, refresh, retry } = useEvents('upcoming');
  const unreadCount = useUnreadCount();

  const visibleEvents = useMemo(
    () => (filter === 'all' ? events : events?.filter((event) => event.role === filter) ?? null),
    [events, filter]
  );

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Text style={styles.wordmark}>Gathrly</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
            }
            onPress={() => router.push('/notifications')}
            style={({ pressed }) => [styles.bell, pressed && styles.pressed]}>
            <View style={styles.bellIcon}>
              <Image
                source={require('@/assets/images/home/bell.svg')}
                style={styles.bellIcon}
                contentFit="contain"
              />
              {unreadCount > 0 ? <View style={styles.badge} /> : null}
            </View>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <ActionButton
            icon={require('@/assets/images/home/drafts.svg')}
            label="Drafts"
            onPress={() => router.push('/events/drafts')}
          />
          <ActionButton
            icon={require('@/assets/images/home/history.svg')}
            label="Past events"
            onPress={() => router.push('/events/past')}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.titleArea}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <View style={styles.chips}>
              {FILTERS.map(({ key, label }) => (
                <FilterChip
                  key={key}
                  label={label}
                  selected={filter === key}
                  onPress={() => setFilter(key)}
                />
              ))}
            </View>
          </View>

          <EventList
            events={visibleEvents}
            variant="upcoming"
            error={error}
            onRetry={retry}
            emptyTitle={EMPTY_STATE[filter].title}
            emptyMessage={EMPTY_STATE[filter].message}
            emptyAction={
              EMPTY_STATE[filter].canCreate
                ? {
                    label: 'Create an event',
                    icon: require('@/assets/images/home/plus.svg'),
                    onPress: () => router.push('/create'),
                  }
                : undefined
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.pageBackground,
  },
  content: {
    // Grows to fill the screen so an empty state can center itself in the room left.
    flexGrow: 1,
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  top: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
    letterSpacing: -0.55,
    color: Brand.teal,
  },
  bell: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    width: 20,
    height: 22,
  },
  // Where the Figma badge sits in the 20×22 bell: a 4px-radius circle at (16, 4).
  badge: {
    position: 'absolute',
    top: 0,
    left: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.badge,
  },
  pressed: {
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  section: {
    flex: 1,
    gap: 16,
  },
  titleArea: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: Brand.ink,
  },
  chips: {
    flexDirection: 'row',
    gap: 12,
  },
});
