import { Pressable, StyleSheet, Text } from 'react-native';

import { Brand, Radii } from '@/constants/theme';

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Pill toggle for the All / Hosting / Attending filter. */
export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Brand.chipBorder,
    backgroundColor: Brand.chipBackground,
  },
  selected: {
    borderColor: Brand.ink,
    backgroundColor: Brand.ink,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontSize: 13,
    color: Brand.ink,
  },
  selectedLabel: {
    color: Brand.chipBackground,
  },
});
