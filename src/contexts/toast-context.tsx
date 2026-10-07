import { Image } from 'expo-image';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOutUp, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radii } from '@/constants/theme';

const CHECK_ICON = require('@/assets/images/create/circle-check.svg');
const VISIBLE_MS = 3500;

type Toast = { id: number; title: string; message?: string };

type ToastContextValue = {
  /** Briefly shows a green confirmation at the top of the screen. */
  showToast: (toast: { title: string; message?: string }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const nextId = useRef(0);

  const showToast = useCallback((next: { title: string; message?: string }) => {
    nextId.current += 1;
    setToast({ id: nextId.current, ...next });
    AccessibilityInfo.announceForAccessibility(
      [next.title, next.message].filter(Boolean).join('. ')
    );
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext value={value}>
      {children}
      <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 8 }]}>
        {toast ? (
          <Animated.View
            key={toast.id}
            entering={SlideInUp.duration(250)}
            exiting={FadeOutUp.duration(200)}>
            <Pressable
              accessibilityRole="alert"
              accessibilityHint="Dismisses the message"
              onPress={() => setToast(null)}
              style={styles.toast}>
              <Image source={CHECK_ICON} style={styles.icon} contentFit="contain" />
              <View style={styles.text}>
                <Text style={styles.title}>{toast.title}</Text>
                {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
              </View>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext>
  );
}

export function useToast(): ToastContextValue {
  const context = use(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a <ToastProvider>');
  }
  return context;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: Radii.tile,
    backgroundColor: Brand.successFill,
  },
  icon: {
    width: 20,
    height: 20,
  },
  text: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: 700,
    color: Brand.successText,
  },
  message: {
    fontSize: 14,
    color: Brand.successText,
  },
});
