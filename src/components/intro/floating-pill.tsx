import { Image } from 'expo-image';
import { StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { Brand, Radii } from '@/constants/theme';

type FloatingPillProps = {
  icon: ImageSourcePropType;
  iconWidth?: number;
  iconHeight?: number;
  label: string;
};

/** Frosted white chip with an icon and label, floating over the welcome illustration. */
export function FloatingPill({ icon, iconWidth = 15, iconHeight = 15, label }: FloatingPillProps) {
  return (
    <View style={styles.pill}>
      <Image source={icon} style={{ width: iconWidth, height: iconHeight }} contentFit="contain" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: Brand.pillBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    color: Brand.muted,
  },
});
