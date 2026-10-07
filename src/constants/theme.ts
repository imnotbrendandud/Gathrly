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
  /** Quieter helper text ("A verification code will be sent…", "Or"). */
  hintSubtle: '#a0a0a0',
  /** Underlined text links ("Change email address"). */
  tealDark: '#0b847a',
  /** Hairline in the "Or" divider. */
  divider: 'rgba(225, 191, 185, 0.5)',
  /** Outline on the social sign-in buttons. */
  buttonOutline: '#8f8f8f',
  /** Fill of a code box in the error state. */
  errorBackground: '#fff5f5',

  // Home screen (Figma "Organizer" → Home). Names follow the Figma variables.
  /** Screen background behind the cards. */
  pageBackground: '#f7fbfb',
  /** Cards and outlined buttons. */
  surface: '#ffffff',
  /** color6: card and button outline. */
  border: '#e2e2e2',
  /** color7: hairlines inside a card and above the nav bar. */
  hairline: '#dbdbdb',
  /** color8: outline of an inactive filter chip. */
  chipBorder: '#c7c7c7',
  /** color2: fill of an inactive filter chip; text on an active one. */
  chipBackground: '#f8f8f8',
  /** color1: bottom navigation bar. */
  navBackground: '#fcfcfc',
  /** color11: secondary text and inactive nav items. */
  textMuted: '#6f6f6f',
  /** Date line on an event card. */
  textDate: '#5d605f',
  /** Green/green9: RSVP confirmed. */
  success: '#30a46c',
  /** Yellow/yellow11: a response is still needed. */
  warning: '#946800',

  /** color4: fill of a quiet button, e.g. "Create an event" in an empty state. */
  subtleFill: '#ededed',
  /** Title on a compact event card (one you're attending). */
  cardTitle: '#333333',

  // RSVP status chips and the "Confirm by" alert on an event card.
  /** Green/green4, green10, green11: "Going". */
  successFill: '#ddf3e4',
  successBorder: '#299764',
  successText: '#18794e',
  /** Gray/gray4, gray9, gray11: "Maybe", "Invited". */
  neutralFill: '#ededed',
  neutralBorder: '#8f8f8f',
  neutralText: '#6f6f6f',
  /** Yellow/yellow2: behind the "Confirm by" alert (its text and icon use `warning`). */
  warningFill: '#fffce8',

  // Notifications screen.
  /** color4: track of the Events / Invites segmented control. */
  segmentedTrack: '#ededed',
  /** color8: the selected segment. */
  segmentedSelected: '#c7c7c7',
  /** Unread dot on the bell (the Figma badge). */
  badge: '#f24236',

  // Create Event form and its sheets.
  /** color1: fill of a text field, select or list row. */
  fieldBackground: '#fcfcfc',
  /** color9: outline of a field that has a value. */
  fieldBorderFilled: '#8f8f8f',
  /** color3: track of a switch that is off. */
  switchOffFill: '#f3f3f3',
  /** overlay/black/black10: dims the screen behind a bottom sheet. */
  overlay: 'rgba(0, 0, 0, 0.48)',
  /** color10: hours and minutes above and below the selected time. */
  wheelText: '#858585',
} as const;

export const Radii = {
  input: 9,
  tile: 16,
  pill: 9999,
  /** Event cards. */
  card: 10,
  /** Outlined action buttons (Drafts, Past Events). */
  button: 7,
  /** Selects, list groups and small buttons in the Create Event form. */
  select: 5,
  /** Top corners of a bottom sheet. */
  sheet: 24,
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
