import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet, SheetActions } from '@/components/create/bottom-sheet';
import { Calendar } from '@/components/create/calendar';
import { CALENDAR_ICON } from '@/components/create/fields';
import { MINUTE_STEP, TimeWheel } from '@/components/create/time-wheel';
import { Brand, Radii } from '@/constants/theme';
import { formatShortDateTime } from '@/lib/format-event';

const CLEAR_ICON = require('@/assets/images/create/clear.svg');

/** 5:00 PM, the time the design shows picked by default. */
const DEFAULT_START_MINUTES = 17 * 60;
const DEFAULT_LENGTH_MINUTES = 3 * 60;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function minutesOf(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

/** `day` at `minutes` after midnight. */
function atMinutes(day: Date, minutes: number) {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    Math.floor(minutes / 60),
    minutes % 60
  );
}

/** The wheel only has quarter hours, so a saved 5:10 opens on 5:00. */
function roundToStep(minutes: number) {
  return Math.floor(minutes / MINUTE_STEP) * MINUTE_STEP;
}

type EventDateSheetProps = {
  visible: boolean;
  start: Date | null;
  end: Date | null;
  onConfirm: (start: Date, end: Date | null) => void;
  onClose: () => void;
};

/**
 * "Set Date": when the event starts and, optionally, ends. The calendar and
 * time wheel edit whichever of the two fields at the top is selected.
 */
export function EventDateSheet({ visible, onClose, ...props }: EventDateSheetProps) {
  return (
    <BottomSheet visible={visible} title="Set Date" onClose={onClose}>
      <EventDatePicker onClose={onClose} {...props} />
    </BottomSheet>
  );
}

/** The sheet's content. It mounts each time the sheet opens, starting from the form's values. */
function EventDatePicker({ start, end, onConfirm, onClose }: Omit<EventDateSheetProps, 'visible'>) {
  const [active, setActive] = useState<'start' | 'end'>('start');
  const [startDay, setStartDay] = useState(start ? startOfDay(start) : null);
  const [startMinutes, setStartMinutes] = useState(
    start ? roundToStep(minutesOf(start)) : DEFAULT_START_MINUTES
  );
  const [endDay, setEndDay] = useState(end ? startOfDay(end) : null);
  const [endMinutes, setEndMinutes] = useState(() => {
    if (end) return roundToStep(minutesOf(end));
    const startMins = start ? roundToStep(minutesOf(start)) : DEFAULT_START_MINUTES;
    return Math.min(startMins + DEFAULT_LENGTH_MINUTES, 24 * 60 - MINUTE_STEP);
  });
  const [month, setMonth] = useState(start ?? new Date());

  const nextStart = startDay ? atMinutes(startDay, startMinutes) : null;
  const nextEnd = endDay ? atMinutes(endDay, endMinutes) : null;

  const error =
    nextStart && nextStart <= new Date()
      ? 'Pick a time that hasn’t passed yet.'
      : nextStart && nextEnd && nextEnd <= nextStart
        ? 'The end has to be after the start.'
        : null;

  const today = startOfDay(new Date());
  const isDisabled = (day: Date) =>
    day < today || (active === 'end' && startDay !== null && day < startDay);

  const selectEnd = () => {
    setActive('end');
    if (endDay) setMonth(endDay);
    else if (startDay) setMonth(startDay);
  };

  return (
    <>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} bounces={false}>
        <View style={styles.section}>
          <View style={styles.fields}>
            <DateBox
              label="Date"
              value={nextStart}
              active={active === 'start'}
              onPress={() => {
                setActive('start');
                if (startDay) setMonth(startDay);
              }}
            />
            <DateBox
              label="End Date (optional)"
              value={nextEnd}
              active={active === 'end'}
              onPress={selectEnd}
              onClear={nextEnd ? () => setEndDay(null) : undefined}
            />
          </View>
          <Calendar
            month={month}
            onMonthChange={setMonth}
            selected={active === 'start' ? startDay : endDay}
            isDisabled={isDisabled}
            onSelect={(day) => {
              if (active === 'start') {
                setStartDay(day);
                // Keep a set end from landing before the new start day.
                if (endDay && endDay < day) setEndDay(day);
              } else {
                setEndDay(day);
              }
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time</Text>
          <TimeWheel
            value={active === 'start' ? startMinutes : endMinutes}
            onChange={active === 'start' ? setStartMinutes : setEndMinutes}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </ScrollView>

      <SheetActions
        confirmLabel="Confirm"
        confirmDisabled={!nextStart || error !== null}
        onCancel={onClose}
        onConfirm={() => nextStart && onConfirm(nextStart, nextEnd)}
      />
    </>
  );
}

/** Guests can answer until the end of the day the host picks. */
const DEADLINE_MINUTES = 23 * 60 + 59;

type DeadlineSheetProps = {
  visible: boolean;
  value: Date | null;
  /** The event's start: answers have to be in by then. */
  latest: Date | null;
  onConfirm: (deadline: Date | null) => void;
  onClose: () => void;
};

/** RSVP Deadline: just a day; the deadline is 11:59 PM that day (or the start, if sooner). */
export function DeadlineSheet({ visible, onClose, ...props }: DeadlineSheetProps) {
  return (
    <BottomSheet visible={visible} title="RSVP Deadline" onClose={onClose}>
      <DeadlinePicker onClose={onClose} {...props} />
    </BottomSheet>
  );
}

function DeadlinePicker({
  value,
  latest,
  onConfirm,
  onClose,
}: Omit<DeadlineSheetProps, 'visible'>) {
  const [day, setDay] = useState(value ? startOfDay(value) : null);
  const [month, setMonth] = useState(value ?? latest ?? new Date());

  const today = startOfDay(new Date());
  const lastDay = latest ? startOfDay(latest) : null;

  const deadlineFor = (picked: Date) => {
    const endOfDay = atMinutes(picked, DEADLINE_MINUTES);
    return latest && endOfDay > latest ? latest : endOfDay;
  };

  return (
    <>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} bounces={false}>
        <View style={styles.section}>
          <Calendar
            month={month}
            onMonthChange={setMonth}
            selected={day}
            isDisabled={(d) => d < today || (lastDay !== null && d > lastDay)}
            onSelect={setDay}
          />
          <Text style={styles.hint}>
            {day
              ? `Guests can RSVP until ${formatShortDateTime(deadlineFor(day))}.`
              : 'Pick the last day guests can RSVP.'}
          </Text>
          {value ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onConfirm(null)}
              style={({ pressed }) => [styles.removeLink, pressed && styles.pressed]}>
              <Text style={styles.link}>Remove deadline</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <SheetActions
        confirmLabel="Confirm"
        confirmDisabled={!day}
        onCancel={onClose}
        onConfirm={() => day && onConfirm(deadlineFor(day))}
      />
    </>
  );
}

function DateBox({
  label,
  value,
  active,
  onPress,
  onClear,
}: {
  label: string;
  value: Date | null;
  active: boolean;
  onPress: () => void;
  onClear?: () => void;
}) {
  return (
    <View style={styles.dateField}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value ? formatShortDateTime(value) : 'not set'}`}
        accessibilityState={{ selected: active }}
        onPress={onPress}
        style={[styles.dateBox, value && styles.dateBoxFilled, active && styles.dateBoxActive]}>
        <Text style={[styles.dateValue, !value && styles.placeholder]} numberOfLines={1}>
          {value ? formatShortDateTime(value) : 'Select date'}
        </Text>
        {onClear ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
            hitSlop={10}
            onPress={onClear}>
            <Image source={CLEAR_ICON} style={styles.icon} contentFit="contain" />
          </Pressable>
        ) : (
          <Image source={CALENDAR_ICON} style={styles.icon} contentFit="contain" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 17.5,
    fontWeight: 700,
    color: Brand.ink,
  },
  fields: {
    flexDirection: 'row',
    gap: 10,
  },
  dateField: {
    flex: 1,
    gap: 7,
  },
  label: {
    fontSize: 14,
    color: Brand.ink,
  },
  dateBox: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderRadius: Radii.button,
    borderWidth: 1,
    borderColor: Brand.inputBorder,
    backgroundColor: Brand.fieldBackground,
  },
  dateBoxFilled: {
    borderColor: Brand.fieldBorderFilled,
  },
  // Which of the two the calendar is editing.
  dateBoxActive: {
    borderColor: Brand.ink,
  },
  dateValue: {
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
  error: {
    fontSize: 12,
    color: Brand.errorText,
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: Brand.textMuted,
  },
  removeLink: {
    alignSelf: 'flex-end',
  },
  link: {
    fontSize: 12,
    color: Brand.tealDark,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.6,
  },
});
