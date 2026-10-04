import { Image } from 'expo-image';
import { StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radii } from '@/constants/theme';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

/** Full-width search field with a magnifier icon. Filtering is up to the caller. */
export function SearchBar({ value, onChangeText, placeholder = 'Search for an event' }: SearchBarProps) {
  return (
    <View style={styles.bar}>
      <Image
        source={require('@/assets/images/home/search.svg')}
        style={styles.icon}
        contentFit="contain"
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Brand.inputPlaceholder}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderRadius: Radii.button,
    borderWidth: 1,
    borderColor: Brand.inputBorder,
    backgroundColor: Brand.inputBackground,
  },
  icon: {
    width: 16,
    height: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 13,
    color: Brand.ink,
  },
});
