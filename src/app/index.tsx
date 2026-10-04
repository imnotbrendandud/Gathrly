import { Image } from 'expo-image'; // Image library for displaying images
import { Redirect, useRouter } from 'expo-router'; // Navigation management
import { StyleSheet, Text, View } from 'react-native'; // React Native libraries
import { SafeAreaView } from 'react-native-safe-area-context';

import { FloatingPill } from '@/components/intro/floating-pill';
import { GlowBackground } from '@/components/intro/glow-background';
import { PrimaryButton } from '@/components/intro/primary-button';
import { Brand, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function WelcomeScreen() {
  const router = useRouter(); // Initialize route navigation
  const { isRestoring, isSignedIn } = useAuth();

  // The splash overlay is still on top for this frame, so rendering nothing
  // while the stored session is checked avoids showing a signed-in user the
  // welcome screen and then yanking it away.
  if (isRestoring) return null;
  if (isSignedIn) return <Redirect href="/home" />;

  return ( // Everything that displays on the screen
    <View style={styles.screen}>
      {/* Keeps content within the screen boundaries of the current device */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.illustration}>
            {/* Styling component */}
            <GlowBackground />

            <View style={styles.dinnerPillRow}>
              <FloatingPill
                icon={require('@/assets/images/intro/calendar-pill-icon.svg')}
                iconWidth={13.5}
                iconHeight={15}
                label="Dinner @ 7 PM"
                hoverDuration={2800}
                hoverPhase={0.15}
              />
            </View>

            <View style={styles.logoBlock}>
              <View style={styles.logoTile}>
                <Image
                  source={require('@/assets/images/intro/logo-mark-white.svg')}
                  style={styles.logoMark}
                  contentFit="contain"
                />
              </View>
              <Text style={styles.wordmark}>Gathrly</Text>
            </View>

            <View style={styles.rooftopPillRow}>
              <FloatingPill
                icon={require('@/assets/images/intro/pin-pill-icon.svg')}
                label="Rooftop Bar"
                hoverDuration={3300}
                hoverPhase={0.7}
              />
            </View>

            <View style={styles.rsvpPill}>
              <FloatingPill
                icon={require('@/assets/images/intro/check-pill-icon.svg')}
                label="3 RSVPs"
                hoverDuration={3000}
                hoverPhase={0.45}
              />
            </View>
          </View>

          <View style={styles.ctas}>
            <PrimaryButton label="Get started" onPress={() => router.push('/get-started')} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.four,
  },
  illustration: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  dinnerPillRow: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.four,
  },
  logoBlock: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  logoTile: {
    width: 64,
    height: 64,
    borderRadius: Radii.tile,
    backgroundColor: Brand.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Brand.teal,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  logoMark: {
    width: 28.5,
    height: 27,
  },
  wordmark: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: 800,
    color: Brand.teal,
    textAlign: 'center',
  },
  rooftopPillRow: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingRight: 72,
  },
  rsvpPill: {
    position: 'absolute',
    left: 0,
    top: 227,
  },
  ctas: {
    alignSelf: 'stretch',
    gap: 10,
  },
});
