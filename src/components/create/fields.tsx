import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
  type TextInputProps,
} from 'react-native';

import { Toggle } from '@/components/create/toggle';
import { Brand, Radii } from '@/constants/theme';

export const CALENDAR_ICON = require('@/assets/images/create/calendar.svg') as ImageSourcePropType;
export const CHEVRON_DOWN_ICON =
  require('@/assets/images/create/chevron-down.svg') as ImageSourcePropType;

/** Label above a field ("Event Name"). */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  value: string;
};

/**
 * The Figma "InputWithLabel": a 36px field whose outline darkens once it has a
 * value. `multiline` gives the 64px Description box.
 */
export function TextField({ label, value, multiline, ...inputProps }: TextFieldProps) {
  return (
    <Field label={label}>
      <TextInput
        value={value}
        multiline={multiline}
        accessibilityLabel={label}
        placeholderTextColor={Brand.inputPlaceholder}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.box,
          multiline ? styles.textArea : styles.input,
          value ? styles.boxFilled : null,
        ]}
        {...inputProps}
      />
    </Field>
  );
}

type PickerFieldProps = {
  label: string;
  /** What's chosen; null shows the placeholder. */
  value: string | null;
  placeholder?: string;
  /**
   * input: looks like a text field, with a calendar icon (Date, RSVP Deadline).
   * select: a quieter dropdown with a chevron (Event Visibility, Plus Ones).
   */
  variant: 'input' | 'select';
  onPress: () => void;
};

/** A field that opens a sheet instead of taking typing. */
export function PickerField({ label, value, placeholder, variant, onPress }: PickerFieldProps) {
  const isSelect = variant === 'select';
  return (
    <Field label={label}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value ?? placeholder ?? 'not set'}`}
        onPress={onPress}
        style={({ pressed }) => [
          isSelect ? styles.select : [styles.box, styles.input, value ? styles.boxFilled : null],
          styles.row,
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value ?? placeholder ?? ''}
        </Text>
        <Image
          source={isSelect ? CHEVRON_DOWN_ICON : CALENDAR_ICON}
          style={styles.icon}
          contentFit="contain"
        />
      </Pressable>
    </Field>
  );
}

/** Location: blank until set, then the place's name over its address. */
export function LocationField({
  value,
  onPress,
}: {
  value: { title: string; subtitle: string } | null;
  onPress: () => void;
}) {
  return (
    <Field label="Location">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          value ? `Location, ${value.title}, ${value.subtitle}` : 'Location, not set'
        }
        onPress={onPress}
        style={({ pressed }) => [
          styles.box,
          value ? [styles.boxFilled, styles.locationFilled] : styles.input,
          pressed && styles.pressed,
        ]}>
        {value ? (
          <>
            <Text style={styles.locationTitle} numberOfLines={1}>
              {value.title}
            </Text>
            {value.subtitle ? (
              <Text style={styles.locationSubtitle} numberOfLines={1}>
                {value.subtitle}
              </Text>
            ) : null}
          </>
        ) : null}
      </Pressable>
    </Field>
  );
}

type SwitchRowProps = {
  label: string;
  /** A bold title with this line under it, as on "Contribution List". */
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function SwitchRow({ label, description, value, onValueChange, disabled }: SwitchRowProps) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchLabels}>
        <Text style={description ? styles.switchTitle : styles.label}>{label}</Text>
        {description ? <Text style={styles.label}>{description}</Text> : null}
      </View>
      <Toggle
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={label}
        disabled={disabled}
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
  box: {
    borderRadius: Radii.button,
    borderWidth: 1,
    borderColor: Brand.inputBorder,
    backgroundColor: Brand.fieldBackground,
    paddingHorizontal: 10,
    fontSize: 13,
    color: Brand.ink,
  },
  boxFilled: {
    borderColor: Brand.fieldBorderFilled,
  },
  input: {
    height: 36,
    paddingVertical: 0,
  },
  textArea: {
    height: 64,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: Brand.inputBackground,
  },
  select: {
    height: 36,
    paddingHorizontal: 7,
    borderRadius: Radii.select,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.fieldBackground,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    flex: 1,
    fontSize: 13,
    color: Brand.ink,
  },
  placeholder: {
    color: Brand.inputPlaceholder,
  },
  icon: {
    width: 16,
    height: 16,
  },
  locationFilled: {
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
  },
  locationTitle: {
    fontSize: 13,
    color: Brand.ink,
  },
  locationSubtitle: {
    fontSize: 12,
    color: Brand.ink,
  },
  pressed: {
    opacity: 0.7,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  switchLabels: {
    flex: 1,
    gap: 4,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: Brand.ink,
  },
});
