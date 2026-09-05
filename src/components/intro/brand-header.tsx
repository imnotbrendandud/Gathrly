import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

export function BrandHeader() {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/intro/logo-mark-teal.svg')}
        style={styles.logo}
        contentFit="contain"
      />
      <Text style={styles.wordmark}>Gathrly</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 19,
    height: 18,
  },
  wordmark: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
    letterSpacing: -0.55,
    color: Brand.teal,
  },
});
