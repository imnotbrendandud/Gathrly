import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';

import { Radii } from '@/constants/theme';

/** 44px square back affordance with the Lucide arrow-left glyph from the Figma designs. */
export function BackButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Image
        source={require('@/assets/images/intro/arrow-left.svg')}
        style={styles.icon}
        contentFit="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: Radii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  pressed: {
    opacity: 0.6,
  },
});
