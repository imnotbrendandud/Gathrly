import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/create/bottom-sheet';
import { Brand } from '@/constants/theme';

type DiscardSheetProps = {
  visible: boolean;
  /** Reopened drafts discard the edits, not the draft, so they say "Discard Changes". */
  discardLabel: string;
  onDiscard: () => void;
  onSaveDraft: () => void;
  onClose: () => void;
};

/** "Event edits will be discarded": shown when closing the form with unsaved changes. */
export function DiscardSheet({
  visible,
  discardLabel,
  onDiscard,
  onSaveDraft,
  onClose,
}: DiscardSheetProps) {
  return (
    <BottomSheet visible={visible} title="Event edits will be discarded" onClose={onClose}>
      <View style={styles.group}>
        <Pressable
          accessibilityRole="button"
          onPress={onDiscard}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={[styles.label, styles.destructive]}>{discardLabel}</Text>
        </Pressable>
        <View style={styles.separator} />
        <Pressable
          accessibilityRole="button"
          onPress={onSaveDraft}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.label}>Save Draft</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 6,
  },
  button: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    fontSize: 13,
    color: Brand.ink,
  },
  destructive: {
    color: Brand.errorText,
  },
  separator: {
    height: 1,
    backgroundColor: Brand.hairline,
  },
});
