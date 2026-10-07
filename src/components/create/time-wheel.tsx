import { useEffect, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Brand, Radii } from '@/constants/theme';

const ROW = 28;
/** Rows shown at once: the selected one with a neighbour above and below. */
const VISIBLE_ROWS = 3;

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
/** Quarter hours, as in the design (4:45, 5:00, 6:15). */
export const MINUTE_STEP = 15;
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, i) =>
  String(i * MINUTE_STEP).padStart(2, '0')
);
const PERIODS = ['AM', 'PM'];

type TimeWheelProps = {
  /** Minutes after midnight, a multiple of `MINUTE_STEP`. */
  value: number;
  onChange: (minutes: number) => void;
};

/** Hour, minute and AM/PM wheels over a grey band marking the chosen time. */
export function TimeWheel({ value, onChange }: TimeWheelProps) {
  const hours24 = Math.floor(value / 60);
  const minute = value % 60;
  const hourIndex = (hours24 % 12 === 0 ? 12 : hours24 % 12) - 1;
  const minuteIndex = Math.round(minute / MINUTE_STEP);
  const periodIndex = hours24 >= 12 ? 1 : 0;

  const set = (hour: number, minuteIdx: number, period: number) => {
    const hour12 = hour + 1;
    onChange(((hour12 % 12) + period * 12) * 60 + minuteIdx * MINUTE_STEP);
  };

  return (
    <View style={styles.wheel}>
      <View style={styles.band} pointerEvents="none" />
      <Column
        items={HOURS}
        index={hourIndex}
        label="Hour"
        width={24}
        onChange={(i) => set(i, minuteIndex, periodIndex)}
      />
      {/* The design keeps a transparent ":" between hours and minutes as spacing. */}
      <Text style={styles.spacer}>:</Text>
      <Column
        items={MINUTES}
        index={minuteIndex}
        label="Minute"
        width={24}
        onChange={(i) => set(hourIndex, i, periodIndex)}
      />
      <Column
        items={PERIODS}
        index={periodIndex}
        label="AM or PM"
        width={28}
        onChange={(i) => set(hourIndex, minuteIndex, i)}
      />
    </View>
  );
}

function Column({
  items,
  index,
  label,
  width,
  onChange,
}: {
  items: string[];
  index: number;
  label: string;
  width: number;
  onChange: (index: number) => void;
}) {
  const scroll = useRef<ScrollView>(null);

  // Follow the value when it changes from outside (opening the sheet, or a tap).
  useEffect(() => {
    scroll.current?.scrollTo({ y: index * ROW, animated: false });
  }, [index]);

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.min(
      items.length - 1,
      Math.max(0, Math.round(event.nativeEvent.contentOffset.y / ROW))
    );
    if (next !== index) onChange(next);
  };

  return (
    <ScrollView
      ref={scroll}
      style={[styles.column, { width }]}
      contentContainerStyle={styles.columnContent}
      contentOffset={{ x: 0, y: index * ROW }}
      snapToInterval={ROW}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      onMomentumScrollEnd={settle}
      onScrollEndDrag={(event) => {
        // A drag that ends without momentum never fires onMomentumScrollEnd.
        if (Math.abs(event.nativeEvent.velocity?.y ?? 0) < 0.05) settle(event);
      }}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: items[index] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        const step = event.nativeEvent.actionName === 'increment' ? 1 : -1;
        const next = index + step;
        if (next >= 0 && next < items.length) onChange(next);
      }}>
      {items.map((item, i) => (
        <Pressable
          key={item}
          onPress={() => onChange(i)}
          style={styles.row}
          importantForAccessibility="no">
          <Text style={[styles.item, i === index && styles.itemSelected]}>{item}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wheel: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ROW,
    height: ROW,
    borderRadius: Radii.pill,
    backgroundColor: Brand.border,
  },
  spacer: {
    fontSize: 16,
    color: 'transparent',
  },
  // ScrollView grows by default; each wheel keeps to its own narrow column.
  column: {
    flexGrow: 0,
    height: ROW * VISIBLE_ROWS,
  },
  columnContent: {
    paddingVertical: ROW,
  },
  row: {
    height: ROW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    fontSize: 16,
    color: Brand.wheelText,
  },
  itemSelected: {
    color: Brand.ink,
  },
});
