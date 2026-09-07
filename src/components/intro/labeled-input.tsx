import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Brand, Radii, Spacing } from '@/constants/theme';

type LabeledInputProps = TextInputProps & {
  label: string;
};

/** Label above a 44px bordered field — the Figma "InputWithLabel" component. */
export function LabeledInput({ label, style, ...inputProps }: LabeledInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Brand.inputPlaceholder}
        style={[styles.input, style]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
