import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { CHEVRON_DOWN_ICON } from '@/components/create/fields';
import { Brand, Radii } from '@/constants/theme';

const CHEVRON_LEFT = require('@/assets/images/create/chevron-left.svg');
const CHEVRON_RIGHT = require('@/assets/images/create/chevron-right.svg');

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** How many years ahead the year picker offers. */
const YEARS_AHEAD = 4;

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** The month's days as rows of seven, padded with nulls before the 1st and after the last. */
function weeksOf(year: number, month: number) {
  const leading = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7));
}

type CalendarProps = {
  /** Any day in the month being shown. */
  month: Date;
  onMonthChange: (month: Date) => void;
  selected: Date | null;
  onSelect: (day: Date) => void;
  /** Days that can't be picked, e.g. ones already over. */
  isDisabled: (day: Date) => boolean;
};

/**
 * The month grid from the Set Date sheet. The month and year buttons swap the
 * grid for a list of months or years to jump to.
 */
export function Calendar({ month, onMonthChange, selected, onSelect, isDisabled }: CalendarProps) {
  const [mode, setMode] = useState<'days' | 'months' | 'years'>('days');
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: YEARS_AHEAD + 1 }, (_, i) => thisYear + i);

  const showMonth = (y: number, m: number) => onMonthChange(new Date(y, m, 1));
  const lastDayOf = (y: number, m: number) => new Date(y, m + 1, 0);
  // Nothing before the current month can be picked, so don't page back into it.
  const canGoBack = new Date(year, monthIndex, 1) > new Date(thisYear, new Date().getMonth(), 1);

  return (
    <View style={styles.calendar}>
      <View style={styles.header}>
        <IconButton
          icon={CHEVRON_LEFT}
          label="Previous month"
          disabled={!canGoBack}
          onPress={() => showMonth(year, monthIndex - 1)}
        />
        <View style={styles.monthAndYear}>
          <SelectButton
            label={MONTHS[monthIndex]}
            accessibilityLabel={`Month, ${MONTHS[monthIndex]}`}
            onPress={() => setMode(mode === 'months' ? 'days' : 'months')}
          />
          <SelectButton
            label={String(year)}
            accessibilityLabel={`Year, ${year}`}
            onPress={() => setMode(mode === 'years' ? 'days' : 'years')}
          />
        </View>
        <IconButton
          icon={CHEVRON_RIGHT}
          label="Next month"
          onPress={() => showMonth(year, monthIndex + 1)}
        />
      </View>

      {mode === 'months' ? (
        <View style={styles.choiceGrid}>
          {MONTHS.map((name, index) => (
            <Choice
              key={name}
              label={name.slice(0, 3)}
              selected={index === monthIndex}
              disabled={isDisabled(lastDayOf(year, index))}
              onPress={() => {
                showMonth(year, index);
                setMode('days');
              }}
            />
          ))}
        </View>
      ) : mode === 'years' ? (
        <View style={styles.choiceGrid}>
          {years.map((option) => (
            <Choice
              key={option}
              label={String(option)}
              selected={option === year}
              onPress={() => {
                showMonth(
                  option,
                  option === thisYear ? Math.max(monthIndex, new Date().getMonth()) : monthIndex
                );
                setMode('days');
              }}
            />
          ))}
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.week}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.weeks}>
            {weeksOf(year, monthIndex).map((week, row) => (
              <View key={row} style={styles.week}>
                {week.map((dayOfMonth, column) => {
                  if (dayOfMonth === null) return <View key={column} style={styles.cell} />;
                  const day = new Date(year, monthIndex, dayOfMonth);
                  const disabled = isDisabled(day);
                  const isSelected = selected !== null && isSameDay(day, selected);
                  return (
                    <Pressable
                      key={column}
                      accessibilityRole="button"
                      accessibilityLabel={`${MONTHS[monthIndex]} ${dayOfMonth}, ${year}`}
                      accessibilityState={{ selected: isSelected, disabled }}
                      disabled={disabled}
                      onPress={() => onSelect(day)}
                      style={styles.cell}>
                      <View style={[styles.date, isSelected && styles.dateSelected]}>
                        <Text
                          style={[
                            styles.dateText,
                            isSelected && styles.dateTextSelected,
                            disabled && styles.dateTextDisabled,
                          ]}>
                          {dayOfMonth}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, (pressed || disabled) && styles.dimmed]}>
      <Image source={icon} style={styles.icon} contentFit="contain" />
    </Pressable>
  );
}

function SelectButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.select, pressed && styles.dimmed]}>
      <Text style={styles.selectLabel}>{label}</Text>
      <Image source={CHEVRON_DOWN_ICON} style={styles.icon} contentFit="contain" />
    </Pressable>
  );
}

function Choice({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.dateSelected,
        pressed && styles.dimmed,
      ]}>
      <Text
        style={[
          styles.dateText,
          selected && styles.dateTextSelected,
          disabled && styles.dateTextDisabled,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  calendar: {
    gap: 18,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Brand.hairline,
    backgroundColor: Brand.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    height: 28,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.select,
  },
  icon: {
    width: 16,
    height: 16,
  },
  dimmed: {
    opacity: 0.4,
  },
  monthAndYear: {
    flexDirection: 'row',
    gap: 8,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 7,
    borderRadius: Radii.select,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.fieldBackground,
  },
  selectLabel: {
    fontSize: 13,
    color: Brand.ink,
  },
  content: {
    gap: 12,
  },
  weeks: {
    gap: 2,
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    fontSize: 12,
    color: Brand.ink,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The design's "Highlight": the same grey as the selected row of the time wheel.
  dateSelected: {
    backgroundColor: Brand.border,
  },
  dateText: {
    fontSize: 14,
    color: Brand.ink,
    textAlign: 'center',
  },
  dateTextSelected: {
    fontWeight: 600,
  },
  dateTextDisabled: {
    color: Brand.inputBorder,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  choice: {
    width: '25%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
});
