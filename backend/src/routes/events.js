const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

router.use(authenticate);

/**
 * Events the signed-in user hosts or has been invited to.
 *
 *   GET /v1/events?scope=upcoming | past | drafts   (default: upcoming)
 *
 * Every row carries the caller's `role`, so the client can filter Hosting /
 * Attending without a second request. Guests who declined never see the event.
 * Drafts are private to their host.
 */
const SCOPES = {
  upcoming: {
    where: `e.status = 'published' AND e.starts_at >= now()
            AND (e.host_id = $1 OR mine.status IN ('invited', 'going', 'maybe'))`,
    orderBy: 'e.starts_at ASC',
  },
  // Only events the user hosted or said they'd go to: an invitation they never
  // accepted is not something they "attended".
  past: {
    where: `e.status = 'published' AND e.starts_at < now()
            AND (e.host_id = $1 OR mine.status = 'going')`,
    orderBy: 'e.starts_at DESC',
  },
  drafts: {
    where: `e.status = 'draft' AND e.host_id = $1`,
    orderBy: 'e.updated_at DESC',
  },
};

router.get('/', async (req, res) => {
  const scope = req.query.scope ?? 'upcoming';
  if (!Object.hasOwn(SCOPES, scope)) {
    throw new AppError(400, 'invalid_scope', `scope must be one of: ${Object.keys(SCOPES).join(', ')}`);
  }
  const { where, orderBy } = SCOPES[scope];

  const { rows } = await pool.query(
    `SELECT e.id,
            e.title,
            e.location,
            e.starts_at,
            e.capacity,
            e.rsvp_deadline,
            e.status,
            (e.host_id = $1) AS is_host,
            -- Accounts made by email sign-in have no display name yet.
            COALESCE(NULLIF(host.name, ''), split_part(host.email, '@', 1)) AS host_name,
            mine.status AS my_rsvp,
            (SELECT count(*) FROM event_rsvps r
              WHERE r.event_id = e.id AND r.status = 'going')::int AS going_count
       FROM events e
       JOIN users host ON host.id = e.host_id
       LEFT JOIN event_rsvps mine ON mine.event_id = e.id AND mine.user_id = $1
      WHERE ${where}
      ORDER BY ${orderBy}`,
    [req.user.id]
  );

  res.json({
    events: rows.map((row) => ({
      id: row.id,
      title: row.title,
      location: row.location,
      startsAt: row.starts_at,
      capacity: row.capacity,
      rsvpDeadline: row.rsvp_deadline,
      status: row.status,
      role: row.is_host ? 'hosting' : 'attending',
      hostName: row.host_name,
      myRsvp: row.my_rsvp,
      goingCount: row.going_count,
    })),
  });
});

/** Every column the Create Event form reads and writes. */
const DETAIL_COLUMNS = `id, host_id, title, description, starts_at, ends_at, location, address,
  visibility, contributions_enabled, plus_ones, require_plus_one_names, rsvp_deadline,
  status, created_at, updated_at`;

function eventDetail(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    address: row.address,
    visibility: row.visibility,
    contributionsEnabled: row.contributions_enabled,
    plusOnes: row.plus_ones,
    requirePlusOneNames: row.require_plus_one_names,
    rsvpDeadline: row.rsvp_deadline,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const MAX_PLUS_ONES = 10;
const DRAFT_TITLE = 'Untitled Event';

function invalid(message) {
  return new AppError(400, 'invalid_event', message);
}

/** Trimmed text, or null when missing or blank. */
function optionalText(value, field, maxLength) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw invalid(`${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw invalid(`${field} must be at most ${maxLength} characters`);
  return trimmed || null;
}

function optionalDate(value, field) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  if (typeof value !== 'string' || Number.isNaN(date.getTime())) {
    throw invalid(`${field} must be an ISO 8601 timestamp`);
  }
  return date;
}

/**
 * Validates a create / update body. Publishing needs a title and a date in the
 * future; a draft may be missing anything, so a host can save whatever they
 * have and finish later.
 */
function parseEventInput(body = {}) {
  const status = body.status ?? 'published';
  if (status !== 'draft' && status !== 'published') {
    throw invalid('status must be draft or published');
  }
  const publishing = status === 'published';

  const title = optionalText(body.title, 'title', 120);
  const startsAt = optionalDate(body.startsAt, 'startsAt');
  const endsAt = optionalDate(body.endsAt, 'endsAt');
  const rsvpDeadline = optionalDate(body.rsvpDeadline, 'rsvpDeadline');

  if (publishing && !title) throw invalid('Give the event a name');
  if (publishing && !startsAt) throw invalid('Pick a date for the event');
  if (publishing && startsAt <= new Date()) throw invalid('The event has to start in the future');
  if (endsAt && (!startsAt || endsAt <= startsAt)) throw invalid('The end has to be after the start');
  if (rsvpDeadline && startsAt && rsvpDeadline > startsAt) {
    throw invalid('The RSVP deadline has to be before the event starts');
  }

  const visibility = body.visibility ?? 'private';
  if (visibility !== 'private' && visibility !== 'public') {
    throw invalid('visibility must be private or public');
  }

  const plusOnes = body.plusOnes ?? 0;
  if (!Number.isInteger(plusOnes) || plusOnes < 0 || plusOnes > MAX_PLUS_ONES) {
    throw invalid(`plusOnes must be a whole number from 0 to ${MAX_PLUS_ONES}`);
  }

  return {
    title: title ?? DRAFT_TITLE,
    description: optionalText(body.description, 'description', 2000),
    startsAt,
    endsAt,
    location: optionalText(body.location, 'location', 200),
    address: optionalText(body.address, 'address', 300),
    visibility,
    contributionsEnabled: body.contributionsEnabled === true,
    plusOnes,
    // Names only mean something when guests can bring someone.
    requirePlusOneNames: plusOnes > 0 && body.requirePlusOneNames === true,
    rsvpDeadline,
    status,
  };
}

function inputValues(input) {
  return [
    input.title,
    input.description,
    input.startsAt,
    input.endsAt,
    input.location,
    input.address,
    input.visibility,
    input.contributionsEnabled,
    input.plusOnes,
    input.requirePlusOneNames,
    input.rsvpDeadline,
    input.status,
  ];
}

/** Create an event, published or saved as a draft. */
router.post('/', async (req, res) => {
  const input = parseEventInput(req.body);
  const { rows } = await pool.query(
    `INSERT INTO events (title, description, starts_at, ends_at, location, address, visibility,
                         contributions_enabled, plus_ones, require_plus_one_names, rsvp_deadline,
                         status, host_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING ${DETAIL_COLUMNS}`,
    [...inputValues(input), req.user.id]
  );
  res.status(201).json({ event: eventDetail(rows[0]) });
});

/** One of the host's own events, e.g. a draft being reopened in the form. */
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${DETAIL_COLUMNS} FROM events WHERE id::text = $1 AND host_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!rows[0]) throw new AppError(404, 'event_not_found', 'That event does not exist.');
  res.json({ event: eventDetail(rows[0]) });
});

/**
 * Save changes to a draft, or publish it by sending `status: 'published'`.
 * Published events cannot be edited yet: there is no design for it.
 */
router.put('/:id', async (req, res) => {
  const input = parseEventInput(req.body);
  const { rows } = await pool.query(
    `UPDATE events
        SET title = $1, description = $2, starts_at = $3, ends_at = $4, location = $5,
            address = $6, visibility = $7, contributions_enabled = $8, plus_ones = $9,
            require_plus_one_names = $10, rsvp_deadline = $11, status = $12, updated_at = now()
      WHERE id::text = $13 AND host_id = $14 AND status = 'draft'
      RETURNING ${DETAIL_COLUMNS}`,
    [...inputValues(input), req.params.id, req.user.id]
  );
  if (!rows[0]) throw new AppError(404, 'draft_not_found', 'That draft does not exist.');
  res.json({ event: eventDetail(rows[0]) });
});

module.exports = router;
