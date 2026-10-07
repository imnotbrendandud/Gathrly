import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Brand } from '@/constants/theme';

const TRACK_WIDTH = 40;
const TRACK_HEIGHT = 24;
const KNOB = 20;
const INSET = 2;
const TRAVEL = TRACK_WIDTH - KNOB - INSET * 2;

type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Read out by screen readers, since the visible label sits beside the switch. */
  accessibilityLabel: string;
  disabled?: boolean;
};

/** The 40×24 "SwitchSmall" from the designs: teal when on, grey when off. */
export function Toggle({ value, onValueChange, accessibilityLabel, disabled }: ToggleProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.set(reduceMotion ? (value ? 1 : 0) : withTiming(value ? 1 : 0, { duration: 160 }));
  }, [value, reduceMotion, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [Brand.switchOffFill, Brand.teal]),
    borderColor: interpolateColor(progress.get(), [0, 1], [Brand.chipBorder, Brand.hairline]),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * TRAVEL }],
    backgroundColor: interpolateColor(
      progress.get(),
      [0, 1],
      [Brand.chipBorder, Brand.fieldBackground]
    ),
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      hitSlop={10}
      onPress={() => onValueChange(!value)}
      style={disabled && styles.disabled}>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: 1,
    justifyContent: 'center',
    // The border sits inside the track, so the knob's inset is measured from it.
    paddingHorizontal: INSET - 1,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
