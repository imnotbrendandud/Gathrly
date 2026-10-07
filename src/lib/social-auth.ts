import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { ApiError } from '@/lib/api';
import { signInWithAppleCredential, signInWithGoogleToken, type Session } from '@/lib/auth-api';

/**
 * Native provider sign-in. Each function resolves to a `Session` on success or
 * `null` when the user backed out of the system sheet — a cancellation is not
 * an error and must not surface a message.
 *
 * Both providers are native modules: they do nothing in Expo Go, and need a
 * development build.
 */

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

let googleConfigured = false;

type GoogleModule = typeof import('@react-native-google-signin/google-signin');

/**
 * Loaded lazily: the package resolves a native module at import time and
 * throws when it is missing (Expo Go), which would take down every screen
 * that imports this file rather than just the Google button.
 */
function loadGoogle(): GoogleModule {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new ApiError(
      0,
      'google_unavailable_in_expo_go',
      'Google Sign-In needs a development build and does not work in Expo Go.'
    );
  }
  return require('@react-native-google-signin/google-signin');
}

function configureGoogle({ GoogleSignin }: GoogleModule) {
  if (googleConfigured) return;
  if (!GOOGLE_WEB_CLIENT_ID) {
    // Mirrors the backend's own 503 code so screens map one message.
    throw new ApiError(
      0,
      'google_not_configured',
      'Google Sign-In is not configured in this build.'
    );
  }
  // The web client id is what makes the returned idToken's audience
  // predictable, which is what the backend verifies against.
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });
  googleConfigured = true;
}

export async function signInWithGoogle(): Promise<Session | null> {
  const google = loadGoogle();
  const { GoogleSignin, statusCodes } = google;
  configureGoogle(google);

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  let response;
  try {
    response = await GoogleSignin.signIn();
  } catch (err: any) {
    // Newer versions report a cancel as a `cancelled` response, but older
    // native paths still reject with this code.
    if (err?.code === statusCodes.SIGN_IN_CANCELLED) return null;
    if (err?.code === statusCodes.IN_PROGRESS) return null;
    if (err?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new ApiError(
        0,
        'google_unavailable',
        'Google Play services are unavailable on this device.'
      );
    }
    throw new ApiError(0, 'google_sign_in_failed', 'Google sign-in failed. Please try again.');
  }

  if (response.type === 'cancelled') return null;

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new ApiError(0, 'google_sign_in_failed', 'Google did not return an identity token.');
  }

  return signInWithGoogleToken(idToken);
}

export async function signInWithApple(): Promise<Session | null> {
  if (!(await AppleAuthentication.isAvailableAsync())) {
    throw new ApiError(
      0,
      'apple_unavailable',
      'Sign in with Apple is not available on this device.'
    );
  }

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (err: any) {
    if (err?.code === 'ERR_REQUEST_CANCELED') return null;
    throw new ApiError(0, 'apple_sign_in_failed', 'Apple sign-in failed. Please try again.');
  }

  if (!credential.identityToken) {
    throw new ApiError(0, 'apple_sign_in_failed', 'Apple did not return an identity token.');
  }

  return signInWithAppleCredential({
    identityToken: credential.identityToken,
    authorizationCode: credential.authorizationCode,
    // Apple returns the name only on the very first authorization, so it has
    // to be forwarded whenever it is present — it is unrecoverable later.
    fullName: credential.fullName
      ? {
          givenName: credential.fullName.givenName,
          familyName: credential.fullName.familyName,
        }
      : null,
  });
}
