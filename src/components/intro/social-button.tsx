import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, type ImageSourcePropType } from 'react-native';

import { Brand, Radii } from '@/constants/theme';

type SocialButtonProps = {
  icon: ImageSourcePropType;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
};

/** Outlined full-width button with a 20px provider icon ("Continue with Google/Apple"). */
export function SocialButton({ icon, label, onPress, disabled }: SocialButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Image source={icon} style={styles.icon} contentFit="contain" />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 18,
    borderRadius: Radii.input,
    borderWidth: 1,
    borderColor: Brand.buttonOutline,
    backgroundColor: '#ffffff',
  },
  icon: {
    width: 20,
    height: 20,
  },
  label: {
    fontSize: 14,
    color: Brand.ink,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
