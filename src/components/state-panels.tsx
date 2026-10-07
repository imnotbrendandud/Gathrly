import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { ActionButton } from '@/components/home/action-button';
import { Brand, Radii } from '@/constants/theme';
import { authErrorMessage } from '@/lib/auth-errors';

/** Shown in place of a list while its first load is in flight. */
export function LoadingState() {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={Brand.textMuted} />
    </View>
  );
}

/** Shown in place of a list that could not be loaded, with a way to try again. */
export function ErrorState({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <View style={styles.state}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{authErrorMessage(error)}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
        <Text style={styles.retryLabel}>Try again</Text>
      </Pressable>
    </View>
  );
}

/**
 * Shown in place of a list that loaded but has nothing in it: a bold title, a
 * line of explanation, and optionally a button. Sits in the middle of whatever
 * room the screen has left, so give the scroll content `flexGrow: 1`.
 */
export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  /** A way out, e.g. "Create an event". Omit when there is nothing to do. */
  action?: { label: string; icon: ImageSourcePropType; onPress: () => void };
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMessage}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {action ? (
        <ActionButton variant="filled" icon={action.icon} label={action.label} onPress={action.onPress} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: Brand.ink,
    textAlign: 'center',
  },
  // The empty state fills the room left over and centers its content in it.
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 24,
  },
  emptyMessage: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: 700,
    color: Brand.ink,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Brand.textMuted,
    textAlign: 'center',
  },
  retry: {
    marginTop: 8,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: Radii.button,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  retryLabel: {
    fontSize: 13,
    color: Brand.ink,
  },
});
