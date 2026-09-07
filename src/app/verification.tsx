import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/intro/back-button';
import { PrimaryButton } from '@/components/intro/primary-button';
import { Brand, MaxContentWidth, Radii, Spacing } from '@/constants/theme';

const CODE_LENGTH = 6;

export default function VerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [hasError, setHasError] = useState(false);

  const canVerify = code.length === CODE_LENGTH;

  const handleChange = (value: string) => {
    setHasError(false);
    setCode(value.replace(/\D/g, '').slice(0, CODE_LENGTH));
  };

  const handleVerify = () => {
    // TODO: POST /v1/auth/email/verify { email, code } -> { token, user }.
    // Store the token, then route. Error codes to surface: invalid_code (400),
    // code_expired (400), too_many_attempts (429, requires a new code).
    if (code === '123456') {
      router.replace('/home');
    } else {
      setHasError(true);
    }
  };

  const handleResend = () => {
    // TODO: POST /v1/auth/email/otp { email }. Requesting a new code
    // invalidates the previous one server-side.
    setCode('');
    setHasError(false);
    inputRef.current?.focus();
  };

  const handleBack = () => router.back();

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.content}>
            <View style={styles.top}>
              <BackButton onPress={handleBack} />
            </View>

            <View style={styles.body}>
              <View style={styles.textBlock}>
                <Text style={styles.title}>Verification Code</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-digit verification code sent to{' '}
                  <Text style={styles.subtitleBold}>{email ?? 'your email'}</Text>
                </Text>
              </View>

              <View style={styles.codeSection}>
                <Pressable style={styles.codeRow} onPress={() => inputRef.current?.focus()}>
                  {Array.from({ length: CODE_LENGTH }, (_, i) => (
                    <View key={i} style={[styles.codeBox, hasError && styles.codeBoxError]}>
                      <Text style={[styles.codeDigit, hasError && styles.codeDigitError]}>
                        {code[i] ?? ''}
                      </Text>
                    </View>
                  ))}
                  <TextInput
                    ref={inputRef}
                    value={code}
                    onChangeText={handleChange}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    maxLength={CODE_LENGTH}
                    autoFocus
                    caretHidden
                    style={styles.hiddenInput}
                  />
                </Pressable>
                {hasError && <Text style={styles.errorText}>Incorrect code. Try again.</Text>}
              </View>

              <View style={styles.cta}>
                <PrimaryButton label="Verify code" onPress={handleVerify} disabled={!canVerify} />
                <View style={styles.links}>
                  <Text style={styles.hint}>
                    Didn’t receive a code?{' '}
                    <Text style={styles.resendLink} onPress={handleResend}>
                      Resend code
                    </Text>
                  </Text>
                  <Text style={styles.changeEmail} onPress={handleBack}>
                    Change email address
                  </Text>
                </View>
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
    gap: Spacing.four,
  },
  top: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 10,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
    color: Brand.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Brand.body,
    textAlign: 'center',
  },
  subtitleBold: {
    fontWeight: 700,
  },
  codeSection: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 12,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  codeBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.input,
    borderWidth: 1,
    borderColor: Brand.inputBorder,
    backgroundColor: Brand.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxError: {
    borderColor: Brand.errorBorder,
    backgroundColor: Brand.errorBackground,
  },
  codeDigit: {
    fontSize: 14,
    color: Brand.ink,
  },
  codeDigitError: {
    color: Brand.errorText,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    color: 'transparent',
  },
  errorText: {
    fontSize: 12,
    color: Brand.errorText,
    textAlign: 'center',
  },
  cta: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 12,
  },
  links: {
    alignItems: 'center',
    gap: Spacing.four,
  },
  hint: {
    fontSize: 12,
    color: Brand.hint,
    textAlign: 'center',
  },
  resendLink: {
    fontWeight: 700,
    color: Brand.teal,
  },
  changeEmail: {
    fontSize: 12,
    color: Brand.tealDark,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
