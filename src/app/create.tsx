import { Image } from 'expo-image';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeadlineSheet, EventDateSheet } from '@/components/create/date-sheets';
import { DiscardSheet } from '@/components/create/discard-sheet';
import { LocationField, PickerField, SwitchRow, TextField } from '@/components/create/fields';
import { HostingDetails } from '@/components/create/hosting-details';
import { LocationSheet } from '@/components/create/location-sheet';
import { OptionSheet, type SheetOption } from '@/components/create/option-sheet';
import { ErrorState } from '@/components/state-panels';
import { Brand, Radii } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { ApiError } from '@/lib/api';
import { authErrorMessage } from '@/lib/auth-errors';
import {
  createEvent,
  fetchEvent,
  updateDraft,
  type EventDetail,
  type EventInput,
  type EventVisibility,
} from '@/lib/events-api';
import { formatClockTime, formatLongDateTime } from '@/lib/format-event';
import { describeLocation, type EventLocation } from '@/lib/places-api';

const CLOSE_ICON = require('@/assets/images/create/x.svg');

/** What the backend names a draft saved without one; the form shows it as blank. */
const DRAFT_TITLE = 'Untitled Event';

const VISIBILITY_OPTIONS: SheetOption<EventVisibility>[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Guests require an invite or a link to RSVP',
    icon: require('@/assets/images/create/lock.svg'),
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone on Gathrly can RSVP',
    icon: require('@/assets/images/create/users.svg'),
  },
];

const plusOnesLabel = (n: number) => (n === 0 ? 'None' : n === 1 ? '1 guest' : `${n} guests`);
const PLUS_ONE_OPTIONS: SheetOption<number>[] = [0, 1, 2, 3, 4, 5].map((n) => ({
  value: n,
  label: plusOnesLabel(n),
}));

/**
 * Where the event is. A place picked in the Location sheet keeps its parts so
 * it can be edited again; one loaded from a saved draft only has its two lines.
 */
type FormLocation = {
  /** Shown on event cards. */
  name: string;
  address: string | null;
  picked: EventLocation | null;
};

type Form = {
  title: string;
  description: string;
  startsAt: Date | null;
  endsAt: Date | null;
  location: FormLocation | null;
  visibility: EventVisibility;
  contributionsEnabled: boolean;
  plusOnes: number;
  requirePlusOneNames: boolean;
  rsvpDeadline: Date | null;
};

/** A new event starts as the design shows it: private, a contribution list, one plus-one each. */
const EMPTY_FORM: Form = {
  title: '',
  description: '',
  startsAt: null,
  endsAt: null,
  location: null,
  visibility: 'private',
  contributionsEnabled: true,
  plusOnes: 1,
  requirePlusOneNames: false,
  rsvpDeadline: null,
};

function formFromDraft(event: EventDetail): Form {
  return {
    title: event.title === DRAFT_TITLE ? '' : event.title,
    description: event.description ?? '',
    startsAt: event.startsAt ? new Date(event.startsAt) : null,
    endsAt: event.endsAt ? new Date(event.endsAt) : null,
    location: event.location
      ? { name: event.location, address: event.address, picked: null }
      : null,
    visibility: event.visibility,
    contributionsEnabled: event.contributionsEnabled,
    plusOnes: event.plusOnes,
    requirePlusOneNames: event.requirePlusOneNames,
    rsvpDeadline: event.rsvpDeadline ? new Date(event.rsvpDeadline) : null,
  };
}

function toInput(form: Form, status: EventInput['status']): EventInput {
  return {
    title: form.title.trim() || null,
    description: form.description.trim() || null,
    startsAt: form.startsAt?.toISOString() ?? null,
    endsAt: form.endsAt?.toISOString() ?? null,
    location: form.location?.name ?? null,
    address: form.location?.address ?? null,
    visibility: form.visibility,
    contributionsEnabled: form.contributionsEnabled,
    plusOnes: form.plusOnes,
    requirePlusOneNames: form.plusOnes > 0 && form.requirePlusOneNames,
    rsvpDeadline: form.rsvpDeadline?.toISOString() ?? null,
    status,
  };
}

/** The two lines in the Location field. */
function locationLines(location: FormLocation) {
  if (location.picked) return describeLocation(location.picked);
  return { title: location.name, subtitle: location.address ?? '' };
}

/** "Sunday, Feb 6 at 5:00 PM", plus the end: "– 8:00 PM", or "– Monday, Feb 7 at 1:00 AM". */
function formatWhen(start: Date, end: Date | null) {
  if (!end) return formatLongDateTime(start);
  const sameDay = start.toDateString() === end.toDateString();
  return `${formatLongDateTime(start)} – ${sameDay ? formatClockTime(end) : formatLongDateTime(end)}`;
}

type Sheet = 'date' | 'location' | 'visibility' | 'deadline' | 'plusOnes' | 'discard';

/**
 * Create Event, opened full screen from the Create tab or an empty Home. With
 * `?draftId=` it reopens a saved draft to finish or publish.
 */
export default function CreateEventScreen() {
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();
  const { token, isRestoring } = useAuth();
  const [draft, setDraft] = useState<EventDetail | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!draftId || !token) return;
    let cancelled = false;
    fetchEvent(token, draftId).then(
      (event) => !cancelled && setDraft(event),
      (err) => !cancelled && setLoadError(err)
    );
    return () => {
      cancelled = true;
    };
  }, [draftId, token, attempt]);

  if (!isRestoring && !token) return <Redirect href="/" />;

  if (draftId && !draft) {
    return (
      <View style={[styles.screen, styles.centered]}>
        {loadError ? (
          <ErrorState
            title="Couldn’t open this draft"
            error={loadError}
            onRetry={() => {
              setLoadError(null);
              setAttempt((n) => n + 1);
            }}
          />
        ) : (
          <ActivityIndicator color={Brand.textMuted} />
        )}
      </View>
    );
  }

  return (
    <CreateEventForm
      draftId={draftId ?? null}
      initial={draft ? formFromDraft(draft) : EMPTY_FORM}
    />
  );
}

function CreateEventForm({ draftId, initial }: { draftId: string | null; initial: Form }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user, signOut } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState(initial);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [saving, setSaving] = useState<EventInput['status'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = (changes: Partial<Form>) => setForm((current) => ({ ...current, ...changes }));
  const closeSheet = () => setSheet(null);
  // Dismissing first stops iOS from handing focus back to the last text field
  // (and scrolling to it) when the sheet closes.
  const openSheet = (next: Sheet) => {
    Keyboard.dismiss();
    setSheet(next);
  };

  const hostName = user?.name?.trim() || user?.email.split('@')[0] || 'You';
  const isDirty = useMemo(
    () => JSON.stringify(toInput(form, 'draft')) !== JSON.stringify(toInput(initial, 'draft')),
    [form, initial]
  );
  const canCreate = form.title.trim() !== '' && form.startsAt !== null && saving === null;

  function close() {
    if (isDirty) openSheet('discard');
    else router.back();
  }

  // Android's back button would otherwise drop the edits without asking.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheet !== null || !isDirty) return false;
      setSheet('discard');
      return true;
    });
    return () => subscription.remove();
  }, [isDirty, sheet]);

  async function save(status: EventInput['status']) {
    if (!token) return;
    setSaving(status);
    setError(null);
    try {
      const input = toInput(form, status);
      const event = draftId
        ? await updateDraft(token, draftId, input)
        : await createEvent(token, input);
      setSheet(null);
      if (status === 'published') {
        router.dismissTo('/home');
        showToast({
          title: 'Event created',
          message: `${event.title} is on your Home screen.`,
        });
      } else {
        router.back();
        showToast({
          title: 'Draft saved',
          message: 'Finish it any time from Drafts.',
        });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setSheet(null);
      setError(authErrorMessage(err));
      setSaving(null);
    }
  }

  return (
    <View style={styles.screen}>
      {/* Padded by hand: SafeAreaView reports no inset inside a full-screen modal on iOS. */}
      <View style={[styles.body, { paddingTop: insets.top }]}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.content}
          bottomOffset={24}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}>
          <View style={styles.titleBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              onPress={close}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <Image source={CLOSE_ICON} style={styles.closeIcon} contentFit="contain" />
            </Pressable>
            <Text accessibilityRole="header" style={styles.title}>
              Create Event
            </Text>
          </View>

          <View style={styles.sections}>
            <View style={styles.section}>
              <TextField
                label="Event Name"
                value={form.title}
                onChangeText={(title) => update({ title })}
                maxLength={120}
                autoCapitalize="words"
                returnKeyType="done"
              />
              <PickerField
                label="Date"
                variant="input"
                value={form.startsAt ? formatWhen(form.startsAt, form.endsAt) : null}
                placeholder="Select date"
                onPress={() => openSheet('date')}
              />
              <LocationField
                value={form.location ? locationLines(form.location) : null}
                onPress={() => openSheet('location')}
              />
              <TextField
                label="Description"
                value={form.description}
                onChangeText={(description) => update({ description })}
                maxLength={2000}
                multiline
              />
              <SwitchRow
                label="Contribution List"
                description="Guest claim items or add their own"
                value={form.contributionsEnabled}
                onValueChange={(contributionsEnabled) => update({ contributionsEnabled })}
              />
              <PickerField
                label="Event Visibility"
                variant="select"
                value={VISIBILITY_OPTIONS.find((option) => option.value === form.visibility)!.label}
                onPress={() => openSheet('visibility')}
              />
            </View>

            <HostingDetails hostName={hostName} />

            <View style={styles.rsvpSection}>
              <Text accessibilityRole="header" style={styles.heading}>
                RSVP Options
              </Text>
              <View style={styles.section}>
                <PickerField
                  label="RSVP Deadline"
                  variant="input"
                  value={form.rsvpDeadline ? formatLongDateTime(form.rsvpDeadline) : null}
                  placeholder="Select date"
                  onPress={() => openSheet('deadline')}
                />
                <PickerField
                  label="Plus Ones"
                  variant="select"
                  value={plusOnesLabel(form.plusOnes)}
                  onPress={() => openSheet('plusOnes')}
                />
                <SwitchRow
                  label="Require plus one names"
                  value={form.plusOnes > 0 && form.requirePlusOneNames}
                  disabled={form.plusOnes === 0}
                  onValueChange={(requirePlusOneNames) => update({ requirePlusOneNames })}
                />
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            disabled: !canCreate,
            busy: saving === 'published',
          }}
          accessibilityHint={canCreate ? undefined : 'Add a name and a date first'}
          disabled={!canCreate}
          onPress={() => save('published')}
          style={({ pressed }) => [
            styles.createButton,
            canCreate && styles.createButtonReady,
            pressed && styles.pressed,
          ]}>
          {saving === 'published' ? (
            <ActivityIndicator color={Brand.ink} />
          ) : (
            <Text style={[styles.createLabel, !canCreate && styles.createLabelDisabled]}>
              Create
            </Text>
          )}
        </Pressable>
      </View>

      <EventDateSheet
        visible={sheet === 'date'}
        start={form.startsAt}
        end={form.endsAt}
        onClose={closeSheet}
        onConfirm={(startsAt, endsAt) => {
          // A deadline after the new start no longer makes sense.
          const rsvpDeadline =
            form.rsvpDeadline && form.rsvpDeadline > startsAt ? null : form.rsvpDeadline;
          update({ startsAt, endsAt, rsvpDeadline });
          closeSheet();
        }}
      />
      <LocationSheet
        visible={sheet === 'location'}
        value={form.location?.picked ?? null}
        onClose={closeSheet}
        onSave={(picked) => {
          const { title, address } = describeLocation(picked);
          update({ location: { name: title, address, picked } });
          closeSheet();
        }}
      />
      <OptionSheet
        visible={sheet === 'visibility'}
        title="Event Visibility"
        options={VISIBILITY_OPTIONS}
        selected={form.visibility}
        onSelect={(visibility) => update({ visibility })}
        onClose={closeSheet}
      />
      <DeadlineSheet
        visible={sheet === 'deadline'}
        value={form.rsvpDeadline}
        latest={form.startsAt}
        onClose={closeSheet}
        onConfirm={(rsvpDeadline) => {
          update({ rsvpDeadline });
          closeSheet();
        }}
      />
      <OptionSheet
        visible={sheet === 'plusOnes'}
        title="Plus Ones"
        options={PLUS_ONE_OPTIONS}
        selected={form.plusOnes}
        onSelect={(plusOnes) => update({ plusOnes })}
        onClose={closeSheet}
      />
      <DiscardSheet
        visible={sheet === 'discard'}
        discardLabel={draftId ? 'Discard Changes' : 'Discard Event'}
        onDiscard={() => {
          setSheet(null);
          router.back();
        }}
        onSaveDraft={() => save('draft')}
        onClose={closeSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.pageBackground,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  content: {
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  titleBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.button,
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  title: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: 700,
    color: Brand.ink,
  },
  pressed: {
    opacity: 0.6,
  },
  sections: {
    gap: 32,
  },
  section: {
    gap: 24,
  },
  rsvpSection: {
    gap: 20,
  },
  heading: {
    fontSize: 16,
    color: Brand.ink,
  },
  footer: {
    gap: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    backgroundColor: Brand.pageBackground,
  },
  error: {
    fontSize: 13,
    color: Brand.errorText,
    textAlign: 'center',
  },
  createButton: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderRadius: Radii.button,
    backgroundColor: Brand.subtleFill,
  },
  createButtonReady: {
    backgroundColor: Brand.buttonBackground,
  },
  createLabel: {
    fontSize: 13,
    color: Brand.ink,
  },
  createLabelDisabled: {
    color: Brand.inputPlaceholder,
  },
});
