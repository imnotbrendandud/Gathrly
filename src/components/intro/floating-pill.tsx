import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text, type ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Brand, Radii } from '@/constants/theme';

type FloatingPillProps = {
  icon: ImageSourcePropType;
  iconWidth?: number;
  iconHeight?: number;
  label: string;
  /** Total up-and-down travel of the hover, in points. */
  hoverDistance?: number;
  /** Time for one way (up or down), in ms. Give each pill a different one so they drift out of step. */
  hoverDuration?: number;
  /** Where in the cycle to start, 0 to 1. Also keeps pills from moving in lockstep. */
  hoverPhase?: number;
};

/**
 * Frosted white chip with an icon and label, floating over the welcome
 * illustration. It hovers: a slow, eased drift up and down around its resting
 * position. Holds still when the system's Reduce Motion setting is on.
 */
export function FloatingPill({
  icon,
  iconWidth = 15,
  iconHeight = 15,
  label,
  hoverDistance = 10,
  hoverDuration = 2600,
  hoverPhase = 0,
}: FloatingPillProps) {
  const reduceMotion = useReducedMotion();
  // 0 = top of the hover, 1 = bottom; 0.5 is the resting position.
  const progress = useSharedValue(reduceMotion ? 0.5 : hoverPhase);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 0.5;
      return;
    }
    // Head for whichever end is farther, then reverse back and forth forever.
    progress.value = hoverPhase;
    progress.value = withRepeat(
      withTiming(hoverPhase >= 0.5 ? 0 : 1, {
        duration: hoverDuration,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, [reduceMotion, hoverPhase, hoverDuration, progress]);

  const hoverStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [-hoverDistance / 2, hoverDistance / 2]) }],
  }));

  return (
    <Animated.View style={[styles.pill, hoverStyle]}>
      <Image source={icon} style={{ width: iconWidth, height: iconHeight }} contentFit="contain" />
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
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
