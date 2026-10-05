import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { BottomSheet } from '@/components/create/bottom-sheet';
import { Brand, Radii } from '@/constants/theme';

export type SheetOption<T> = {
  value: T;
  label: string;
  description?: string;
  icon?: ImageSourcePropType;
};

type OptionSheetProps<T> = {
  visible: boolean;
  title: string;
  options: readonly SheetOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/** A short list to pick one from, e.g. Private / Public. Picking closes the sheet. */
export function OptionSheet<T extends string | number>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: OptionSheetProps<T>) {
  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <View accessibilityRole="radiogroup">
        {options.map((option) => {
          const isSelected = option.value === selected;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={[option.label, option.description].filter(Boolean).join(', ')}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
              style={({ pressed }) => [
                styles.option,
                isSelected && styles.selected,
                pressed && styles.pressed,
              ]}>
              {option.icon ? (
                <Image source={option.icon} style={styles.icon} contentFit="contain" />
              ) : null}
              <View style={styles.text}>
                <Text style={styles.label}>{option.label}</Text>
                {option.description ? (
                  <Text style={styles.description}>{option.description}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 13,
    borderRadius: Radii.select,
  },
  // Not in the design, which only shows the choices; a light fill says which one is current.
  selected: {
    backgroundColor: Brand.chipBackground,
  },
  pressed: {
    opacity: 0.6,
  },
  icon: {
    width: 20,
    height: 20,
  },
  text: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: Brand.ink,
  },
  description: {
    fontSize: 12,
    color: Brand.textMuted,
  },
});
