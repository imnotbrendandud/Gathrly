import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';

/** Stand-in for a tab whose design has not been built yet. */
export function ComingSoon({ title, message }: { title: string; message: string }) {
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: Brand.ink,
  },
  message: {
    fontSize: 14,
    color: Brand.textMuted,
    textAlign: 'center',
  },
});
