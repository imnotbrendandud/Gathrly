import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Brand, Radii } from '@/constants/theme';

type CodeBoxProps = {
  /** The digit in this box, or '' when empty. */
  digit: string;
  /** This is where the next keystroke lands. Shown while the field has focus. */
  active: boolean;
  /** The whole code is selected, so the next keystroke replaces all of it. */
  selected: boolean;
  error: boolean;
};

/** One of the six verification-code boxes. Highlights when it is the current position. */
export function CodeBox({ digit, active, selected, error }: CodeBoxProps) {
  const highlighted = active || selected;
  // The caret marks an empty active box; a filled one already shows its digit.
  const showCaret = active && !selected && digit === '';

  return (
    <View
      style={[styles.box, highlighted && styles.highlighted, error && styles.error]}>
      {showCaret ? <BlinkingCaret /> : null}
      <Text style={[styles.digit, error && styles.digitError]}>{digit}</Text>
    </View>
  );
}

/** A thin teal bar that fades in and out, like a text cursor. Steady when Reduce Motion is on. */
function BlinkingCaret() {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(withTiming(0, { duration: 520, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => cancelAnimation(opacity);
  }, [reduceMotion, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.caret, style]} />;
}

const styles = StyleSheet.create({
  box: {
    width: 44,
    height: 44,
    borderRadius: Radii.input,
    borderWidth: 1,
    borderColor: Brand.inputBorder,
    backgroundColor: Brand.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The current position: a teal outline on a white box. When the whole code is
  // selected (right after a wrong one) every box gets it, so it is clear that
  // typing will replace the lot.
  highlighted: {
    borderWidth: 2,
    borderColor: Brand.teal,
    backgroundColor: Brand.surface,
  },
  // Wins over the teal so a rejected code still reads as an error, but keeps
  // the thicker border of a highlighted box.
  error: {
    borderColor: Brand.errorBorder,
    backgroundColor: Brand.errorBackground,
  },
  digit: {
    fontSize: 14,
    color: Brand.ink,
  },
  digitError: {
    color: Brand.errorText,
  },
  caret: {
    position: 'absolute',
    width: 2,
    height: 20,
    borderRadius: 1,
    backgroundColor: Brand.teal,
  },
});
