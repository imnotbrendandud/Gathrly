import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radii } from '@/constants/theme';

const CLOSE_ICON = require('@/assets/images/create/x.svg');
const OPEN_MS = 260;
const CLOSE_MS = 200;
/** Dragging the handle further than this, or flicking it, closes the sheet. */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;

type BottomSheetProps = {
  visible: boolean;
  /** Called when the user taps outside, presses ✕, drags the sheet down or uses Android back. */
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Stretch to just under the status bar (Location), rather than fitting the content. */
  fullHeight?: boolean;
};

/**
 * The sheet from the designs: dimmed backdrop, white panel with rounded top
 * corners, a grab handle, and a centered title with a close button. It stays
 * mounted while it animates out, so the parent can simply flip `visible`.
 */
export function BottomSheet({ visible, onClose, title, children, fullHeight }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  // Stays true through the closing animation. The content mounts fresh on each
  // open, so sheets can seed their state from props.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  // 0 = open, windowHeight = off screen.
  const offset = useSharedValue(windowHeight);

  useEffect(() => {
    if (visible) {
      offset.set(
        withTiming(0, {
          duration: reduceMotion ? 0 : OPEN_MS,
          easing: Easing.out(Easing.cubic),
        })
      );
      return;
    }
    offset.set(withTiming(windowHeight, { duration: reduceMotion ? 0 : CLOSE_MS }));
    const timer = setTimeout(() => setMounted(false), reduceMotion ? 0 : CLOSE_MS);
    return () => clearTimeout(timer);
  }, [visible, windowHeight, reduceMotion, offset]);

  // Only the handle and title row drag the sheet, so scrolling inside it (the
  // time wheel, search results) never fights the dismiss gesture.
  const drag = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((event) => {
      offset.set(Math.max(0, event.translationY));
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        onClose();
      } else {
        offset.set(withTiming(0, { duration: 160 }));
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(offset.get(), [0, windowHeight], [1, 0]),
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.get() }],
  }));

  if (!mounted) return null;

  return (
    <Modal visible transparent statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
        </Animated.View>

        {/* The top padding keeps even a full-height sheet clear of the status bar,
            including when the keyboard takes away room. */}
        <KeyboardAvoidingView
          behavior="padding"
          style={[styles.root, { paddingTop: insets.top + 8 }]}
          pointerEvents="box-none">
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 24) },
              fullHeight && styles.fullHeight,
              sheetStyle,
            ]}>
            <GestureDetector gesture={drag}>
              <View style={styles.header}>
                <View style={styles.handleRow}>
                  <View style={styles.handle} />
                </View>
                <View style={styles.titleRow}>
                  <View style={styles.side} />
                  <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>
                    {title}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    onPress={onClose}
                    style={({ pressed }) => [styles.side, styles.close, pressed && styles.pressed]}>
                    <Image source={CLOSE_ICON} style={styles.closeIcon} contentFit="contain" />
                  </Pressable>
                </View>
              </View>
            </GestureDetector>
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

/** Cancel and a primary action side by side at the bottom of a sheet. */
export function SheetActions({
  confirmLabel,
  onCancel,
  onConfirm,
  confirmDisabled,
}: {
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}) {
  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        onPress={onCancel}
        style={({ pressed }) => [styles.action, styles.cancel, pressed && styles.pressed]}>
        <Text style={styles.actionLabel}>Cancel</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!confirmDisabled }}
        disabled={confirmDisabled}
        onPress={onConfirm}
        style={({ pressed }) => [
          styles.action,
          styles.confirm,
          confirmDisabled && styles.confirmDisabled,
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.actionLabel, confirmDisabled && styles.actionLabelDisabled]}>
          {confirmLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: Brand.overlay,
  },
  sheet: {
    // Shrinks (and its content scrolls) rather than overflowing a short screen.
    flexShrink: 1,
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopLeftRadius: Radii.sheet,
    borderTopRightRadius: Radii.sheet,
    backgroundColor: Brand.surface,
  },
  fullHeight: {
    flex: 1,
  },
  header: {
    gap: 24,
  },
  handleRow: {
    alignItems: 'center',
  },
  handle: {
    width: 50,
    height: 4,
    borderRadius: Radii.pill,
    backgroundColor: Brand.inputBorder,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    width: 44,
    height: 44,
  },
  close: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: 700,
    color: Brand.ink,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: Radii.input,
  },
  cancel: {
    borderWidth: 1,
    borderColor: Brand.buttonOutline,
  },
  confirm: {
    backgroundColor: Brand.buttonBackground,
  },
  confirmDisabled: {
    backgroundColor: Brand.buttonDisabledBackground,
  },
  actionLabel: {
    fontSize: 14,
    color: Brand.ink,
  },
  actionLabelDisabled: {
    color: Brand.inputPlaceholder,
  },
});
