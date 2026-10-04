import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, type ImageSourcePropType } from 'react-native';

import { Brand, Radii } from '@/constants/theme';

type ActionButtonProps = {
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
  /** outlined: white with a border ("Drafts"). filled: a quiet grey fill ("Create an event"). */
  variant?: 'outlined' | 'filled';
};

/** Icon + label button. */
export function ActionButton({ icon, label, onPress, variant = 'outlined' }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'outlined' ? styles.outlined : styles.filled,
        pressed && styles.pressed,
      ]}>
      <Image source={icon} style={styles.icon} contentFit="contain" />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
    paddingHorizontal: 13,
    borderRadius: Radii.button,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surface,
  },
  filled: {
    backgroundColor: Brand.subtleFill,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    width: 20,
    height: 20,
  },
  label: {
    fontSize: 13,
    color: Brand.ink,
  },
});
