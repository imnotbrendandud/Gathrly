import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Brand } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/format-notification';
import type { NotificationItem } from '@/lib/notifications-api';

const RESPONSE_LABEL = { yes: 'Yes', maybe: 'Maybe', no: 'No' } as const;

/** The sentence, as [text, isBold] pieces: "**Allen Shi** responded **Maybe** to **Field Day 2027**". */
function sentenceOf(notification: NotificationItem): [string, boolean][] {
  const { actorName, eventTitle, type, response } = notification;

  if (type === 'invite') {
    return [
      [actorName, true],
      [' invited you to ', false],
      [eventTitle, true],
    ];
  }

  return [
    [actorName, true],
    [' responded ', false],
    [response ? RESPONSE_LABEL[response] : '', true],
    [' to ', false],
    [eventTitle, true],
  ];
}

/** One line of the Notifications list: who, what they did, and how long ago. */
export function NotificationRow({ notification }: { notification: NotificationItem }) {
  const sentence = sentenceOf(notification);
  const age = formatRelativeTime(notification.createdAt);

  return (
    <View
      accessible
      accessibilityLabel={`${sentence.map(([text]) => text).join('')}, ${age}`}
      style={styles.row}>
      <Avatar name={notification.actorName} />
      <Text style={styles.text}>
        {sentence.map(([text, bold], index) => (
          <Text key={index} style={bold ? styles.bold : undefined}>
            {text}
          </Text>
        ))}
        <Text style={styles.age}>{`  ${age}`}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 13,
    borderRadius: 5,
    backgroundColor: Brand.surface,
  },
  text: {
    flex: 1,
    paddingRight: 24,
    fontSize: 13,
    color: Brand.ink,
  },
  bold: {
    fontWeight: 600,
  },
  age: {
    fontSize: 12,
    color: Brand.textMuted,
  },
});
