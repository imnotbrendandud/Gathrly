import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/contexts/auth-context';
import { ToastProvider } from '@/contexts/toast-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    // Restores the stored session before any screen asks whether the user is
    // signed in.
    <AuthProvider>
      {/* Drives the keyboard-synced animations used by KeyboardAwareScrollView. */}
      <KeyboardProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <ToastProvider>
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="get-started" />
              <Stack.Screen name="verification" />
              <Stack.Screen name="(tabs)" />
              {/* Closing goes through the X so unsaved edits can be offered as a draft. */}
              <Stack.Screen
                name="create"
                options={{
                  presentation: 'fullScreenModal',
                  gestureEnabled: false,
                }}
              />
            </Stack>
          </ToastProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </AuthProvider>
  );
}
