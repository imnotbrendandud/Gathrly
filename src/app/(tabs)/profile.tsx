import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/intro/primary-button';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

/**
 * Placeholder until the Profile design is done: the only thing here is a way to
 * log out.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogOut() {
    setIsLoggingOut(true);
    await signOut();
    router.replace('/');
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.body}>
        <PrimaryButton
          label="Log out"
          variant="secondary"
          disabled={isLoggingOut}
          onPress={handleLogOut}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.pageBackground,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
