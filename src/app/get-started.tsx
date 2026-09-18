import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/intro/brand-header';
import { GlowBackground } from '@/components/intro/glow-background';
import { LabeledInput } from '@/components/intro/labeled-input';
import { OrDivider } from '@/components/intro/or-divider';
import { PrimaryButton } from '@/components/intro/primary-button';
import { SocialButton } from '@/components/intro/social-button';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { requestEmailOtp } from '@/lib/auth-api';
import { authErrorMessage } from '@/lib/auth-errors';
import { signInWithApple, signInWithGoogle } from '@/lib/social-auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Single entry point for sign-up and sign-in. Proving control of an email,
 * Google account, or Apple ID both creates the account and starts the
 * session, so there is no separate "create account" screen any more.
 */
export default function GetStartedScreen() {
  const router = useRouter();
  // Bumped by "Change email address" on the verification screen so we know to
  // wipe the field; a plain back gesture leaves it intact for typo fixes.
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const [email, setEmail] = useState('');
  // Which provider is mid-flight: the button in question shows progress and
  // every other route out of this screen locks until it settles.
  const [pending, setPending] = useState<'email' | 'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  // Adjusting state during render is React's documented alternative to an
  // effect here: it re-renders before committing, with no extra paint.
  const [lastReset, setLastReset] = useState(reset);
  if (reset !== lastReset) {
    setLastReset(reset);
    setEmail('');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isBusy = pending !== null;
  const canContinue = EMAIL_RE.test(normalizedEmail) && !isBusy;

  const handleContinue = async () => {
    if (!canContinue) return;
    Keyboard.dismiss();
    setPending('email');
    setError(null);
    try {
      // Answers 200 whether or not the address has an account, so reaching the
      // next line says the code was sent — never that the account exists.
      await requestEmailOtp(normalizedEmail);
      router.push({ pathname: '/verification', params: { email: normalizedEmail } });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setPending(null);
    }
  };

  // Both providers hand back a session straight away — there is no code to
  // enter — so this screen is where the sign-in completes.
  const handleProvider = async (provider: 'google' | 'apple') => {
    Keyboard.dismiss();
    setPending(provider);
    setError(null);
    try {
      const session = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
      // `null` means the user dismissed the system sheet, which is not a
      // failure and must not leave a message on screen.
      if (!session) return;
      await signIn(session);
      router.replace('/home');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setPending(null);
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Full-bleed decor sits behind the header AND the scroll area. It
              must stay outside the ScrollView, which clips its content and
              would otherwise box the glow in below the logo. */}
          <View style={styles.decor} pointerEvents="none">
            <GlowBackground />
          </View>

          {/* Tapping the fixed header also dismisses the keyboard; the rest
              of the screen is covered by keyboardShouldPersistTaps below. */}
          <Pressable accessible={false} onPress={Keyboard.dismiss}>
            <BrandHeader />
          </Pressable>

          {/* Tracks the keyboard frame-by-frame instead of snapping once it
              has finished opening, and scrolls the focused field into view. */}
          <KeyboardAwareScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
            bottomOffset={Spacing.four}>
            <View style={styles.textBlock}>
              <Text style={styles.title}>Ready to get planning?</Text>
              <Text style={styles.subtitle}>Enter your email to start planning events.</Text>
            </View>

            <LabeledInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="go"
              onSubmitEditing={handleContinue}
            />

            <View style={styles.cta}>
              <PrimaryButton
                label={pending === 'email' ? 'Sending code…' : 'Continue'}
                onPress={handleContinue}
                disabled={!canContinue}
              />
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <Text style={styles.hint}>A verification code will be sent to your email.</Text>
              )}
            </View>

            <OrDivider />

            <View style={styles.social}>
              <SocialButton
                icon={require('@/assets/images/intro/google-icon.svg')}
                label={pending === 'google' ? 'Signing in…' : 'Continue with Google'}
                onPress={() => handleProvider('google')}
                disabled={isBusy}
              />
              {Platform.OS === 'ios' && (
                <SocialButton
                  icon={require('@/assets/images/intro/apple-logo.svg')}
                  label={pending === 'apple' ? 'Signing in…' : 'Continue with Apple'}
                  onPress={() => handleProvider('apple')}
                  disabled={isBusy}
                />
              )}
            </View>
          </KeyboardAwareScrollView>
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
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.four,
  },
  // Spills past the content box on purpose; `screen` clips it.
  decor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  textBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.four,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 700,
    letterSpacing: 0.25,
    color: Brand.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Brand.body,
    textAlign: 'center',
  },
  cta: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 12,
  },
  hint: {
    fontSize: 12,
    color: Brand.hintSubtle,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: Brand.errorText,
    textAlign: 'center',
  },
  social: {
    alignSelf: 'stretch',
    gap: 12,
  },
});
