/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/**
 * Gathrly brand palette from the Figma intro designs
 * (figma.com/design/2ezBBSs4oNDRvVnZKRV6Ts — "Intro pages").
 */
export const Brand = {
  teal: '#0d9488',
  tealGlow: 'rgba(13, 148, 136, 0.1)',
  ink: '#171717',
  body: '#212529',
  muted: '#605e5d',
  hint: '#636c72',
  dialCode: '#666666',
  inputBackground: '#f8f8f8',
  inputBorder: '#c7c7c7',
  inputPlaceholder: '#8f8f8f',
  buttonBackground: '#c7c7c7',
  buttonDisabledBackground: '#ededed',
  errorText: '#dc3d43',
  errorBorder: '#e5484d',
  pillBackground: 'rgba(255, 255, 255, 0.8)',
} as const;

export const Radii = {
  input: 9,
  tile: 16,
  pill: 9999,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
