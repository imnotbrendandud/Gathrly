import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BottomSheet, SheetActions } from '@/components/create/bottom-sheet';
import { TextField } from '@/components/create/fields';
import { Brand, Radii } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { ABORTED_ERROR, ApiError } from '@/lib/api';
import { authErrorMessage } from '@/lib/auth-errors';
import { describeLocation, searchPlaces, type EventLocation, type Place } from '@/lib/places-api';

const SEARCH_ICON = require('@/assets/images/create/search.svg');
const CLEAR_ICON = require('@/assets/images/create/clear.svg');
const PENCIL_ICON = require('@/assets/images/create/pencil.svg');

/** Wait for a pause in typing before searching. */
const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

type LocationSheetProps = {
  visible: boolean;
  value: EventLocation | null;
  onSave: (location: EventLocation) => void;
  onClose: () => void;
};

/**
 * Location: search for an address or place, then optionally add a unit and a
 * friendlier display name before saving.
 */
export function LocationSheet({ visible, onClose, ...props }: LocationSheetProps) {
  return (
    <BottomSheet visible={visible} title="Location" onClose={onClose} fullHeight>
      <LocationEditor onClose={onClose} {...props} />
    </BottomSheet>
  );
}

/** The sheet's content. It mounts each time the sheet opens, starting from the form's value. */
function LocationEditor({ value, onSave, onClose }: Omit<LocationSheetProps, 'visible'>) {
  const [place, setPlace] = useState(value?.place ?? null);
  const [query, setQuery] = useState('');
  const [unit, setUnit] = useState(value?.unit ?? '');
  const [showUnit, setShowUnit] = useState(!!value?.unit);
  const [displayName, setDisplayName] = useState(value?.displayName ?? '');

  const draft: EventLocation | null = place
    ? {
        place,
        unit: (showUnit && unit.trim()) || null,
        displayName: displayName.trim() || null,
      }
    : null;

  return draft ? (
    <>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.details}
        keyboardShouldPersistTaps="handled">
        <View style={styles.group}>
          <View style={styles.addressField}>
            <Text style={styles.addressLabel}>Address</Text>
            <AddressCard
              location={draft}
              onEdit={() => {
                setQuery(place?.street ?? place?.name ?? '');
                setPlace(null);
              }}
            />
          </View>
          {showUnit ? null : (
            <Link label="Add apt, suite, unit, etc." onPress={() => setShowUnit(true)} />
          )}
        </View>

        {showUnit ? (
          <View style={styles.group}>
            <TextField
              label="Apt, Suite, Unit, Etc. (optional)"
              value={unit}
              onChangeText={setUnit}
              autoFocus={!unit}
              returnKeyType="done"
            />
            <Link
              label="Remove apt, suite, unit, etc."
              onPress={() => {
                setUnit('');
                setShowUnit(false);
              }}
            />
          </View>
        ) : null}

        <TextField
          label="Display Name (optional)"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </ScrollView>
      <SheetActions confirmLabel="Save" onCancel={onClose} onConfirm={() => onSave(draft)} />
    </>
  ) : (
    <PlaceSearch query={query} onChangeQuery={setQuery} onPick={setPlace} />
  );
}

function PlaceSearch({
  query,
  onChangeQuery,
  onPick,
}: {
  query: string;
  onChangeQuery: (query: string) => void;
  onPick: (place: Place) => void;
}) {
  const { token } = useAuth();
  // The latest answer, tagged with the query it answers.
  const [response, setResponse] = useState<{
    query: string;
    places: Place[] | null;
    error: unknown;
  } | null>(null);
  const trimmed = query.trim();
  const isActive = trimmed.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!token || trimmed.length < MIN_QUERY_LENGTH) return;

    // Each keystroke cancels the search before it, so results never arrive out of order.
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const places = await searchPlaces(token, trimmed, controller.signal);
        setResponse({ query: trimmed, places, error: null });
      } catch (err) {
        if (err instanceof ApiError && err.code === ABORTED_ERROR) return;
        setResponse({ query: trimmed, places: null, error: err });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [token, trimmed]);

  const isSearching = isActive && response?.query !== trimmed;
  // While a new search runs, keep showing the previous results rather than flashing empty.
  const results = isActive ? (response?.places ?? null) : null;
  const error = isActive && response?.query === trimmed ? response.error : null;

  return (
    <View style={styles.body}>
      <View style={styles.searchBar}>
        <Image source={SEARCH_ICON} style={styles.searchIcon} contentFit="contain" />
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Search for a place or address"
          placeholderTextColor={Brand.inputPlaceholder}
          accessibilityLabel="Search for a place or address"
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={10}
            onPress={() => onChangeQuery('')}>
            <Image source={CLEAR_ICON} style={styles.searchIcon} contentFit="contain" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        style={styles.body}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        {error ? (
          <Text style={styles.status}>{authErrorMessage(error)}</Text>
        ) : results === null ? (
          isSearching ? (
            <ActivityIndicator style={styles.spinner} color={Brand.textMuted} />
          ) : null
        ) : results.length === 0 ? (
          isSearching ? null : (
            <Text style={styles.status}>No places match “{trimmed}”.</Text>
          )
        ) : (
          results.map((result) => (
            <Pressable
              key={result.id}
              accessibilityRole="button"
              accessibilityLabel={`${result.name}, ${result.street ?? ''} ${result.area}`}
              onPress={() => onPick(result)}
              style={({ pressed }) => [styles.result, pressed && styles.pressed]}>
              <Text style={styles.resultTitle} numberOfLines={1}>
                {result.name}
              </Text>
              <Text style={styles.resultSubtitle} numberOfLines={1}>
                {[result.street, result.area].filter(Boolean).join(', ')}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/** The chosen place, as it will read in the form, with a pencil to search again. */
function AddressCard({ location, onEdit }: { location: EventLocation; onEdit: () => void }) {
  const { title, subtitle } = describeLocation(location);
  return (
    <View style={styles.addressCard}>
      <View style={styles.addressText}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change address"
        hitSlop={10}
        onPress={onEdit}
        style={({ pressed }) => pressed && styles.pressed}>
        <Image source={PENCIL_ICON} style={styles.searchIcon} contentFit="contain" />
      </Pressable>
    </View>
  );
}

function Link({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
      <Text style={styles.linkLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  details: {
    gap: 24,
  },
  group: {
    gap: 16,
  },
  addressField: {
    gap: 7,
  },
  addressLabel: {
    fontSize: 13,
    color: Brand.ink,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    padding: 13,
    borderRadius: Radii.select,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  addressText: {
    flex: 1,
    gap: 4,
  },
  link: {
    alignSelf: 'flex-end',
  },
  linkLabel: {
    fontSize: 12,
    color: Brand.tealDark,
    textDecorationLine: 'underline',
  },
  searchBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderRadius: Radii.input,
    borderWidth: 1,
    borderColor: Brand.hairline,
    backgroundColor: Brand.inputBackground,
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 13,
    color: Brand.ink,
  },
  spinner: {
    marginTop: 16,
  },
  status: {
    padding: 13,
    fontSize: 13,
    color: Brand.textMuted,
  },
  result: {
    gap: 4,
    padding: 13,
  },
  resultTitle: {
    fontSize: 13,
    color: Brand.ink,
  },
  resultSubtitle: {
    fontSize: 12,
    color: Brand.textMuted,
  },
  pressed: {
    opacity: 0.6,
  },
});
