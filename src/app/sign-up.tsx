import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/intro/brand-header';
import { GlowBackground } from '@/components/intro/glow-background';
import { PhoneInput } from '@/components/intro/phone-input';
import { PrimaryButton } from '@/components/intro/primary-button';
import { Brand, MaxContentWidth, Radii, Spacing } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const digits = phone.replace(/\D/g, '');
  const canContinue = name.trim().length > 0 && digits.length === 10;

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
                <Text style={styles.title}>Ready to get planning?</Text>
                <Text style={styles.subtitle}>Enter your details to start planning events.</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  style={styles.input}
                  placeholderTextColor={Brand.inputPlaceholder}
                />
              </View>

              <PhoneInput value={phone} onChangeText={setPhone} />

              <View style={styles.cta}>
                <PrimaryButton label="Continue" onPress={handleContinue} disabled={!canContinue} />
                <Text style={styles.hint}>A verification code will be sent to your phone.</Text>
              </View>

              <Text style={styles.footer}>
                Already have an account?{' '}
                <Text style={styles.footerLink} onPress={() => router.replace('/sign-in')}>
                  Sign in
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
  field: {
    alignSelf: 'stretch',
    gap: 7,
  },
  label: {
    fontSize: 14,
    color: Brand.ink,
  },
  input: {
    height: 44,
    borderRadius: Radii.input,
    borderWidth: 1,
    borderColor: Brand.inputBorder,
    backgroundColor: Brand.inputBackground,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    color: Brand.ink,
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
