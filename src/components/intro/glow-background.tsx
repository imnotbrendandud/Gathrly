import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { Brand } from '@/constants/theme';

const GLOW_SIZE = 384;

/**
 * Soft teal glow decor behind the intro screens.
 * Web gets a real gaussian blur; native fakes the falloff with
 * concentric low-opacity circles (RN core has no cross-platform blur filter).
 */
function Glow({ style }: { style: ViewStyle }) {
  if (Platform.OS === 'web') {
    return <View pointerEvents="none" style={[styles.circle, styles.blur, style]} />;
  }
  return (
    <View pointerEvents="none" style={[styles.wrap, style]}>
      <View style={[styles.ring, styles.ringOuter]} />
      <View style={[styles.ring, styles.ringMid]} />
      <View style={[styles.ring, styles.ringInner]} />
    </View>
  );
}

export function GlowBackground() {
  return (
    <>
      <Glow style={styles.topGlow} />
      <Glow style={styles.bottomGlow} />
    </>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: Brand.tealGlow,
  },
  blur: Platform.OS === 'web' ? ({ filter: 'blur(60px)' } as ViewStyle) : {},
  wrap: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    backgroundColor: 'rgba(13, 148, 136, 0.045)',
  },
  ringOuter: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
  },
  ringMid: {
    width: GLOW_SIZE * 0.75,
    height: GLOW_SIZE * 0.75,
    borderRadius: (GLOW_SIZE * 0.75) / 2,
  },
  ringInner: {
    width: GLOW_SIZE * 0.5,
    height: GLOW_SIZE * 0.5,
    borderRadius: (GLOW_SIZE * 0.5) / 2,
  },
  topGlow: {
    top: -122,
    right: -206,
  },
  bottomGlow: {
    top: 347,
    right: 129,
  },
});
