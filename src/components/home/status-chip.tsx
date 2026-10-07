import { StyleSheet, Text, View } from 'react-native';

import { Brand, Radii } from '@/constants/theme';
import type { RsvpChip } from '@/lib/format-event';

const TONES = {
  success: { backgroundColor: Brand.successFill, borderColor: Brand.successBorder, color: Brand.successText },
  neutral: { backgroundColor: Brand.neutralFill, borderColor: Brand.neutralBorder, color: Brand.neutralText },
} as const;

/** Small outlined pill showing your RSVP on an event card ("Going", "Maybe"). */
export function StatusChip({ label, tone }: RsvpChip) {
  const { color, ...box } = TONES[tone];
  return (
    <View style={[styles.chip, box]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
  },
});
