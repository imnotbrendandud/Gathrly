import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { Avatar } from '@/components/avatar';
import { StatusChip } from '@/components/home/status-chip';
import { Brand, Radii } from '@/constants/theme';
import type { EventSummary } from '@/lib/events-api';
import {
  TO_BE_DECIDED,
  formatEventDate,
  formatGoingCount,
  getConfirmBy,
  getRsvpChip,
} from '@/lib/format-event';

const CALENDAR_ICON = require('@/assets/images/home/calendar.svg');
const PIN_ICON = require('@/assets/images/home/map-pin.svg');
const USERS_ICON = require('@/assets/images/home/users.svg');
const ALERT_ICON = require('@/assets/images/home/alert-triangle.svg');

/** Where a card is shown; each screen's design shows a different amount. */
export type EventCardVariant = 'upcoming' | 'past' | 'draft';

/** One event in a list. Picks the layout for the screen and, on Home, for your role. */
export function EventCard({ event, variant }: { event: EventSummary; variant: EventCardVariant }) {
  if (variant === 'past') return <PastCard event={event} />;
  if (variant === 'draft') return <DraftCard event={event} />;
  return event.role === 'hosting' ? <HostingCard event={event} /> : <AttendingCard event={event} />;
}

/** Home, an event you host: big title, when and where, and how many are going. */
function HostingCard({ event }: { event: EventSummary }) {
  const date = formatEventDate(event.startsAt);
  const going = formatGoingCount(event);

  return (
    <View
      accessible
      accessibilityLabel={[event.title, date, event.location, going].filter(Boolean).join('. ')}
      style={[styles.card, styles.hostingCard]}>
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.info}>
          <InfoRow icon={CALENDAR_ICON} text={date} color={Brand.textDate} />
          {event.location ? <InfoRow icon={PIN_ICON} text={event.location} color={Brand.textMuted} /> : null}
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.footerIconBox}>
          <Image source={USERS_ICON} style={styles.footerIcon} contentFit="contain" />
        </View>
        <Text style={styles.footerText}>{going}</Text>
      </View>
    </View>
  );
}

/** Home, an event you're invited to: compact, with your answer and any deadline. */
function AttendingCard({ event }: { event: EventSummary }) {
  const date = formatEventDate(event.startsAt);
  const chip = getRsvpChip(event);
  const confirmBy = getConfirmBy(event);

  return (
    <View
      accessible
      accessibilityLabel={[event.title, date, event.location, chip?.label, confirmBy].filter(Boolean).join('. ')}
      style={[styles.card, styles.attendingCard]}>
      <View style={styles.attendingTop}>
        <View style={styles.attendingDetails}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <View style={styles.info}>
            <InfoRow icon={CALENDAR_ICON} text={date} color={Brand.textMuted} small />
            {event.location ? (
              <InfoRow icon={PIN_ICON} text={event.location} color={Brand.textMuted} small />
            ) : null}
          </View>
        </View>
        {chip ? <StatusChip {...chip} /> : null}
      </View>
      {confirmBy ? (
        <View style={styles.alert}>
          <Image source={ALERT_ICON} style={styles.alertIcon} contentFit="contain" />
          <Text style={styles.alertText}>{confirmBy}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Past Events: what and when, and who hosted it. */
function PastCard({ event }: { event: EventSummary }) {
  const date = formatEventDate(event.startsAt);
  const host = event.role === 'hosting' ? 'You' : event.hostName;

  return (
    <View
      accessible
      accessibilityLabel={`${event.title}. ${date}. Hosted by ${host}`}
      style={[styles.card, styles.listCard, styles.pastCard]}>
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <InfoRow icon={CALENDAR_ICON} text={date} color={Brand.textDate} />
      </View>
      <View style={[styles.footer, styles.hostFooter]}>
        <Avatar name={event.hostName} size={24} />
        <Text style={styles.footerText}>{host}</Text>
      </View>
    </View>
  );
}

/** Drafts: what has been filled in so far, with TBD for the rest. */
function DraftCard({ event }: { event: EventSummary }) {
  const router = useRouter();
  const date = formatEventDate(event.startsAt);
  const location = event.location ?? TO_BE_DECIDED;

  // Tapping a draft reopens it in the Create Event form to finish or publish.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}. ${date}. ${location}`}
      accessibilityHint="Opens the draft to finish it"
      onPress={() => router.push({ pathname: '/create', params: { draftId: event.id } })}
      style={({ pressed }) => [styles.card, styles.listCard, pressed && styles.pressed]}>
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.info}>
          <InfoRow icon={CALENDAR_ICON} text={date} color={Brand.textDate} />
          <InfoRow icon={PIN_ICON} text={location} color={Brand.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}

function InfoRow({
  icon,
  text,
  color,
  small,
}: {
  icon: ImageSourcePropType;
  text: string;
  color: string;
  /** 12px text, for compact cards. */
  small?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Image source={icon} style={styles.infoIcon} contentFit="contain" />
      <Text style={[styles.infoText, small && styles.infoTextSmall, { color }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surface,
  },
  hostingCard: {
    gap: 16,
    padding: 16,
    borderRadius: Radii.tile,
  },
  attendingCard: {
    gap: 16,
    padding: 16,
    borderRadius: Radii.card,
  },
  pressed: {
    opacity: 0.7,
  },
  // Past Events and Drafts: tighter vertical padding.
  listCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radii.card,
  },
  pastCard: {
    gap: 12,
  },
  details: {
    gap: 8,
  },
  title: {
    fontSize: 18,
    lineHeight: 22.5,
    fontWeight: 600,
    color: Brand.ink,
  },
  info: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoIcon: {
    width: 12,
    height: 12,
  },
  infoText: {
    flexShrink: 1,
    fontSize: 14,
  },
  infoTextSmall: {
    fontSize: 12,
  },
  attendingTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  attendingDetails: {
    flex: 1,
    gap: 8,
  },
  compactTitle: {
    fontSize: 14,
    lineHeight: 17.5,
    fontWeight: 700,
    color: Brand.cardTitle,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 4,
    backgroundColor: Brand.warningFill,
  },
  alertIcon: {
    width: 16,
    height: 16,
  },
  alertText: {
    fontSize: 12,
    color: Brand.warning,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Brand.hairline,
  },
  hostFooter: {
    paddingTop: 8,
  },
  footerIconBox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerIcon: {
    width: 16,
    height: 16,
  },
  footerText: {
    fontSize: 14,
    color: Brand.ink,
  },
});
