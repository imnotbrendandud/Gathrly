import { Image } from 'expo-image';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand, Radii, Spacing } from '@/constants/theme';

type PhoneInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
};

/** Labeled US phone number field with flag + dial code, from the Figma intro designs. */
export function PhoneInput({ value, onChangeText, label = 'Phone Number' }: PhoneInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.container}>
        <View style={styles.flagSection}>
          <Image
            source={require('@/assets/images/intro/flag-us.png')}
            style={styles.flag}
            contentFit="cover"
          />
          <Image
            source={require('@/assets/images/intro/chevron-down.svg')}
            style={styles.chevron}
            contentFit="contain"
          />
        </View>
        <View style={styles.inputArea}>
          <Text style={styles.dialCode}>+1</Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="Phone Number"
            placeholderTextColor={Brand.inputPlaceholder}
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={14}
            style={styles.input}
          />
        </View>
      </View>
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
  container: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.input,
    borderWidth: 1,
    borderColor: Brand.inputBorder,
    backgroundColor: Brand.inputBackground,
  },
  flagSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    height: '100%',
  },
  flag: {
    width: 20,
    height: 11,
  },
  chevron: {
    width: 20,
    height: 20,
  },
  inputArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingRight: Spacing.three,
    height: '100%',
  },
  dialCode: {
    fontSize: 14,
    color: Brand.dialCode,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: Brand.ink,
    padding: 0,
  },
});
