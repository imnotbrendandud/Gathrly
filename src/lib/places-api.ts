import { apiRequest } from '@/lib/api';

/** A search result in the Location sheet — see backend/src/routes/places.js. */
export type Place = {
  id: string;
  /** Headline: a street address ("123 Street St") or a named place ("Montibeller Park"). */
  name: string;
  /** A named place's street address; null when `name` already is one. */
  street: string | null;
  /** "Detroit, MI, United States" */
  area: string;
};

export async function searchPlaces(token: string, query: string, signal?: AbortSignal) {
  const { places } = await apiRequest<{ places: Place[] }>(
    `/v1/places/search?q=${encodeURIComponent(query)}`,
    { token, signal }
  );
  return places;
}

/**
 * Where an event happens, as the host set it up in the Location sheet: the
 * place they picked, plus an optional unit and a friendlier name.
 */
export type EventLocation = {
  place: Place;
  unit: string | null;
  displayName: string | null;
};

/** "123 Street St Unit 411" */
function streetLine({ place, unit }: EventLocation) {
  const street = place.street ?? place.name;
  return unit ? `${street} ${unit}` : street;
}

/**
 * The two lines shown for a location (in the form and on the Location sheet's
 * address card), and what gets saved:
 *   with a display name → "Natalie's Apartment" / "123 Street St Unit 411, Detroit, MI, United States"
 *   a street address    → "123 Street St Unit 411" / "Detroit, MI, United States"
 *   a named place       → "Montibeller Park" / "1 Park Rd, Rochester Hills, MI, United States"
 */
export function describeLocation(location: EventLocation) {
  const { place, displayName } = location;
  const street = streetLine(location);
  const address = [street, place.area].filter(Boolean).join(', ');

  if (displayName) return { title: displayName, subtitle: address, address };
  if (place.street) return { title: place.name, subtitle: address, address };
  return { title: street, subtitle: place.area, address };
}
