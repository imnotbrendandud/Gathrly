import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii } from '@/constants/theme';

type SegmentedControlProps<T extends string> = {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
};

/** Full-width two-or-more way toggle ("Events" | "Invites"), with hairlines between segments. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {options.map((option, index) => {
        const selected = option.key === value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <Fragment key={option.key}>
            {isFirst ? null : <View style={styles.separator} />}
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.key)}
              style={[
                styles.segment,
                selected && styles.selected,
                isFirst && styles.firstSegment,
                isLast && styles.lastSegment,
              ]}>
              <Text style={styles.label}>{option.label}</Text>
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

const SEGMENT_RADIUS = 5;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Radii.button,
    backgroundColor: Brand.segmentedTrack,
  },
  segment: {
    flex: 1,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  selected: {
    backgroundColor: Brand.segmentedSelected,
  },
  firstSegment: {
    borderTopLeftRadius: SEGMENT_RADIUS,
    borderBottomLeftRadius: SEGMENT_RADIUS,
  },
  lastSegment: {
    borderTopRightRadius: SEGMENT_RADIUS,
    borderBottomRightRadius: SEGMENT_RADIUS,
  },
  separator: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: Brand.hairline,
  },
  label: {
    fontSize: 12,
    color: Brand.ink,
    textAlign: 'center',
  },
});
