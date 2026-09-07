import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/intro/brand-header';
import { GlowBackground } from '@/components/intro/glow-background';
import { LabeledInput } from '@/components/intro/labeled-input';
import { OrDivider } from '@/components/intro/or-divider';
import { PrimaryButton } from '@/components/intro/primary-button';
import { SocialButton } from '@/components/intro/social-button';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Single entry point for sign-up and sign-in. Proving control of an email,
 * Google account, or Apple ID both creates the account and starts the
 * session, so there is no separate "create account" screen any more.
 */
export default function GetStartedScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const normalizedEmail = email.trim().toLowerCase();
  const canContinue = EMAIL_RE.test(normalizedEmail);

  const handleContinue = () => {
    // TODO: POST /v1/auth/email/otp { email } (always 200), then navigate.
    router.push({ pathname: '/verification', params: { email: normalizedEmail } });
  };

  const handleGoogle = () => {
    // TODO: GoogleSignin.signIn() -> POST /v1/auth/google { idToken }.
  };

  const handleApple = () => {
    // TODO: AppleAuthentication.signInAsync() -> POST /v1/auth/apple
    // { identityToken, authorizationCode, fullName }. Always forward fullName:
    // Apple only returns it on the very first authorization.
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.content}>
            <BrandHeader />

            <View style={styles.body}>
              <GlowBackground />

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
                onSubmitEditing={canContinue ? handleContinue : undefined}
              />

              <View style={styles.cta}>
                <PrimaryButton label="Continue" onPress={handleContinue} disabled={!canContinue} />
                <Text style={styles.hint}>A verification code will be sent to your email.</Text>
              </View>

              <OrDivider />

              <View style={styles.social}>
                <SocialButton
                  icon={require('@/assets/images/intro/google-icon.svg')}
                  label="Continue with Google"
                  onPress={handleGoogle}
                />
                {Platform.OS === 'ios' && (
                  <SocialButton
                    icon={require('@/assets/images/intro/apple-logo.svg')}
                    label="Continue with Apple"
                    onPress={handleApple}
                  />
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  body: {
    flex: 1,
    alignSelf: 'stretch',
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
  social: {
    alignSelf: 'stretch',
    gap: 12,
  },
});
