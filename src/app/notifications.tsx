import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DetachedNavBar } from '@/components/bottom-nav';
import { NotificationRow } from '@/components/notifications/notification-row';
import { SegmentedControl } from '@/components/notifications/segmented-control';
import { EmptyState, ErrorState, LoadingState } from '@/components/state-panels';
import { TitleBar } from '@/components/title-bar';
import { Brand } from '@/constants/theme';
import { useNotifications } from '@/hooks/use-notifications';
import { groupNotifications } from '@/lib/format-notification';

type Tab = 'all' | 'invites';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'invites', label: 'Invites' },
] as const;

const EMPTY_STATE: Record<Tab, { title: string; message: string }> = {
  all: {
    title: 'No Event Updates',
    message: 'Updates and RSVPs for your events will show up here.',
  },
  invites: {
    title: 'No RSVP Reminders',
    message: 'Any events waiting for your final RSVP will appear here.',
  },
};

export default function NotificationsScreen() {
  const [tab, setTab] = useState<Tab>('all');
  const { notifications, error, isRefreshing, refresh, retry } = useNotifications();

  const sections = useMemo(
    () =>
      notifications === null
        ? null
        : groupNotifications(
            tab === 'all' ? notifications : notifications.filter((item) => item.type === 'invite')
          ),
    [notifications, tab]
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TitleBar title="Notifications" />
            <SegmentedControl options={TABS} value={tab} onChange={setTab} />
          </View>

          {sections === null ? (
            error !== null ? (
              <ErrorState title="Couldn’t load notifications" error={error} onRetry={retry} />
            ) : (
              <LoadingState />
            )
          ) : sections.length === 0 ? (
            <EmptyState title={EMPTY_STATE[tab].title} message={EMPTY_STATE[tab].message} />
          ) : (
            <View style={styles.sections}>
              {sections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text accessibilityRole="header" style={styles.sectionTitle}>
                    {section.title}
                  </Text>
                  <View>
                    {section.items.map((item) => (
                      <NotificationRow key={item.id} notification={item} />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <DetachedNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.surface,
  },
  body: {
    flex: 1,
  },
  content: {
    // Grows to fill the screen so an empty state can center itself in the room left.
    flexGrow: 1,
    gap: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    gap: 24,
    paddingHorizontal: 16,
  },
  sections: {
    gap: 16,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: 700,
    color: Brand.ink,
  },
});
