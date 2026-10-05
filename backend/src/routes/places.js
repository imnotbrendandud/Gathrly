const express = require('express');
const env = require('../config/env');
const authenticate = require('../middleware/authenticate');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

router.use(authenticate);

/** The Location sheet shows the top 15 matches (per the design annotation). */
const RESULT_LIMIT = 15;
const PROVIDER_TIMEOUT_MS = 5000;

const US_STATES = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO',
  Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS',
  Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA',
  Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT',
  Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM',
  'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
};

/**
 * A Photon (OpenStreetMap) feature as the app's place: a headline and the
 * area under it, as in the design ("123 Street St" / "Detroit, MI, United States").
 */
function toPlace(feature) {
  const p = feature.properties ?? {};
  const street = p.street && p.housenumber ? `${p.housenumber} ${p.street}` : p.street ?? null;
  const name = p.name ?? street;
  if (!name) return null;

  const state = p.countrycode === 'US' ? US_STATES[p.state] ?? p.state : p.state;
  const area = [p.city ?? p.town ?? p.village ?? p.locality ?? p.district, state, p.country]
    .filter(Boolean)
    .join(', ');

  return {
    id: `${p.osm_type ?? ''}${p.osm_id ?? name}`,
    name,
    // A named place (a park, a bar) keeps its street for the full address.
    street: street && street !== name ? street : null,
    area,
  };
}

/**
 * Address and place suggestions while the host types in the Location sheet.
 *
 *   GET /v1/places/search?q=123 main
 *
 * Proxied so the app never talks to the geocoder directly and the provider can
 * be swapped (PLACES_SEARCH_URL) without an app release.
 */
router.get('/search', async (req, res) => {
  const query = String(req.query.q ?? '').trim();
  if (query.length < 2) return res.json({ places: [] });

  const url = new URL(env.places.searchUrl);
  url.searchParams.set('q', query.slice(0, 200));
  url.searchParams.set('limit', String(RESULT_LIMIT));
  url.searchParams.set('lang', 'en');

  let payload;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': env.places.userAgent, Accept: 'application/json' },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`places provider answered ${response.status}`);
    payload = await response.json();
  } catch (err) {
    console.error('[places]', err.message);
    throw new AppError(502, 'places_unavailable', 'Location search is unavailable right now.');
  }

  const seen = new Set();
  const places = [];
  for (const feature of payload.features ?? []) {
    const place = toPlace(feature);
    const key = place && `${place.name}|${place.street}|${place.area}`;
    if (!place || seen.has(key)) continue;
    seen.add(key);
    places.push(place);
  }
  res.json({ places });
});

module.exports = router;
