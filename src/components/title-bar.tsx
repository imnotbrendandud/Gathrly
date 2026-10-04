import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/intro/back-button';
import { Brand } from '@/constants/theme';

/** Back arrow and screen title, for screens pushed on top of Home ("Notifications", "Drafts"). */
export function TitleBar({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View style={styles.bar}>
      <BackButton
        color={Brand.ink}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      />
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: 700,
    color: Brand.ink,
  },
});
