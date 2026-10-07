import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/intro/back-button';
import { CodeBox } from '@/components/intro/code-box';
import { PrimaryButton } from '@/components/intro/primary-button';
import { useCountdown } from '@/hooks/use-countdown';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import { requestEmailOtp, verifyEmailOtp } from '@/lib/auth-api';
import { authErrorMessage } from '@/lib/auth-errors';

const CODE_LENGTH = 6;
/** Lockout after a wrong code, so Verify can't be hammered. */
const VERIFY_LOCKOUT_SECONDS = 5;
/** Each resend sends a real email, so gate it harder. */
const RESEND_COOLDOWN_SECONDS = 30;

export default function VerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  // Whether the hidden input has the keyboard, so the boxes only show a
  // position while the user can actually type.
  const [isFocused, setIsFocused] = useState(false);
  const { signIn } = useAuth();
  // Only set to force a select-all after a rejection; `undefined` hands
  // selection control back to the platform.
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>();

  const lockout = useCountdown();
  const resend = useCountdown();

  const canVerify = code.length === CODE_LENGTH && !isVerifying && !lockout.isActive;

  // Where the next digit goes: the first empty box, or the last one once the
  // code is full (a further digit is ignored; backspace clears that box).
  const activeIndex = Math.min(code.length, CODE_LENGTH - 1);
  // After a rejected code the whole code is selected, so any key replaces it.
  const isAllSelected = selection !== undefined;

  const handleChange = (value: string) => {
    setSelection(undefined);
    setError(null);
    setCode(value.replace(/\D/g, '').slice(0, CODE_LENGTH));
  };

  const handleVerify = async () => {
    if (!canVerify || !email) return;
    setIsVerifying(true);
    setError(null);

    try {
      const session = await verifyEmailOtp(email, code);
      await signIn(session);
      router.replace('/home');
      return;
    } catch (err) {
      setError(authErrorMessage(err));

      // `code_expired` and `too_many_attempts` both mean the server has
      // consumed the code: nothing the user types can revive it, so clear the
      // field and point them at Resend instead of locking Verify.
      const spent =
        err instanceof ApiError &&
        (err.code === 'code_expired' || err.code === 'too_many_attempts');

      if (spent) {
        setCode('');
        setSelection(undefined);
        lockout.reset();
        resend.reset();
      } else if (err instanceof ApiError && err.code === 'invalid_code') {
        // Wrong code: keep the digits on screen so the user can see what they
        // entered and spot a transposed digit — wiping input on error destroys
        // their work and is the usual anti-pattern. Instead select the whole
        // code so the next keypress replaces it outright. Without the
        // select-all the field is full at maxLength and they would have to
        // backspace six times.
        setSelection({ start: 0, end: CODE_LENGTH });
        lockout.start(VERIFY_LOCKOUT_SECONDS);
      }
      // A network or server failure says nothing about the code, so it leaves
      // the digits alone and does not burn a lockout — the user can retry now.

      inputRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resend.isActive || isResending || !email) return;
    setIsResending(true);
    setError(null);

    try {
      await requestEmailOtp(email);
      // Requesting a new code invalidates the previous one server-side, so the
      // old digits are dead and clearing them is correct here (unlike a
      // wrong-code rejection).
      setCode('');
      setSelection(undefined);
      lockout.reset();
      // Only start the cooldown once an email has actually gone out; a failed
      // request should not cost the user 30 seconds.
      resend.start(RESEND_COOLDOWN_SECONDS);
      inputRef.current?.focus();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    router.back();
  };

  const handleChangeEmail = () => {
    Keyboard.dismiss();
    // `reset` tells Get Started to wipe the email field. A plain back gesture
    // deliberately leaves it intact, for correcting a typo.
    const target = { pathname: '/get-started' as const, params: { reset: String(Date.now()) } };
    if (router.canDismiss()) {
      router.dismissTo(target);
    } else {
      router.replace(target);
    }
  };

  const verifyLabel = isVerifying
    ? 'Verifying…'
    : lockout.isActive
      ? `Try again in ${lockout.secondsLeft}s`
      : 'Verify code';

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Pressable accessible={false} onPress={Keyboard.dismiss} style={styles.top}>
            <BackButton onPress={handleBack} />
          </Pressable>

          {/* Tracks the keyboard frame-by-frame instead of snapping once it
              has finished opening, and scrolls the code row into view. */}
          <KeyboardAwareScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
            bottomOffset={Spacing.four}>
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
                  <CodeBox
                    key={i}
                    digit={code[i] ?? ''}
                    active={isFocused && i === activeIndex}
                    selected={isFocused && isAllSelected}
                    error={!!error}
                  />
                ))}
                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={handleChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  selection={selection}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={CODE_LENGTH}
                  autoFocus
                  caretHidden
                  style={styles.hiddenInput}
                />
              </Pressable>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <View style={styles.cta}>
              <PrimaryButton label={verifyLabel} onPress={handleVerify} disabled={!canVerify} />
              <View style={styles.links}>
                <Text style={styles.hint}>
                  {isResending ? (
                    'Sending a new code…'
                  ) : resend.isActive ? (
                    `You can request a new code in ${resend.secondsLeft}s`
                  ) : (
                    <>
                      Didn’t receive a code?{' '}
                      <Text style={styles.resendLink} onPress={handleResend}>
                        Resend code
                      </Text>
                    </>
                  )}
                </Text>
                <Text style={styles.changeEmail} onPress={handleChangeEmail}>
                  Change email address
                </Text>
              </View>
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
    gap: Spacing.four,
  },
  top: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
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
