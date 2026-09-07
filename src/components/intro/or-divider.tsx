import { StyleSheet, Text, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

/** Hairline — "Or" — hairline, separating email sign-in from the social buttons. */
export function OrDivider({ label = 'Or' }: { label?: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Brand.divider,
  },
  label: {
    fontSize: 12,
    color: Brand.hintSubtle,
    paddingHorizontal: Spacing.three,
  },
});
