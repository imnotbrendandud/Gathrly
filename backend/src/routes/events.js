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

module.exports = router;
