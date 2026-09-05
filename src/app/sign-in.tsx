import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/intro/brand-header';
import { GlowBackground } from '@/components/intro/glow-background';
import { PhoneInput } from '@/components/intro/phone-input';
import { PrimaryButton } from '@/components/intro/primary-button';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';

export default function SignInScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');

  const digits = phone.replace(/\D/g, '');
  const canContinue = digits.length === 10;

  const handleContinue = () => {
    router.push({ pathname: '/verification', params: { phone: digits } });
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
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Sign in with your phone number to continue.</Text>
              </View>

              <PhoneInput value={phone} onChangeText={setPhone} />

              <View style={styles.cta}>
                <PrimaryButton label="Continue" onPress={handleContinue} disabled={!canContinue} />
                <Text style={styles.hint}>A verification code will be sent to your phone.</Text>
              </View>

              <Text style={styles.footer}>
                New to Gathrly?{' '}
                <Text style={styles.footerLink} onPress={() => router.replace('/sign-up')}>
                  Create an account
                </Text>
              </Text>
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
    alignItems: 'center',
    gap: Spacing.four,
    alignSelf: 'stretch',
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
    color: Brand.hint,
    textAlign: 'center',
  },
  footer: {
    fontSize: 12,
    color: Brand.hint,
    textAlign: 'center',
  },
  footerLink: {
    fontWeight: 700,
    color: Brand.teal,
  },
});
