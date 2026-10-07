const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

/** The list is a recent-activity feed, not an archive. */
const LIST_LIMIT = 100;

/**
 * The signed-in user's notifications, newest first.
 *
 *   GET /v1/notifications
 *
 * The client splits them into the Events and Invites tabs by `type`, and into
 * Today / This Week / Older by `createdAt`.
 */
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT n.id,
            n.type,
            n.response,
            n.created_at,
            n.read_at,
            n.event_id,
            e.title AS event_title,
            -- Accounts made by email sign-in have no display name yet.
            COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1), 'Someone') AS actor_name
       FROM notifications n
       JOIN events e ON e.id = n.event_id
       LEFT JOIN users u ON u.id = n.actor_id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2`,
    [req.user.id, LIST_LIMIT]
  );

  res.json({
    notifications: rows.map((row) => ({
      id: row.id,
      type: row.type,
      response: row.response,
      actorName: row.actor_name,
      eventId: row.event_id,
      eventTitle: row.event_title,
      createdAt: row.created_at,
      read: row.read_at !== null,
    })),
  });
});

/** How many are unread — drives the red dot on the Home screen's bell. */
router.get('/unread-count', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [req.user.id]
  );
  res.json({ count: rows[0].count });
});

/** Mark everything read. Called when the user opens the Notifications screen. */
router.post('/read', async (req, res) => {
  await pool.query(
    'UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL',
    [req.user.id]
  );
  res.json({ ok: true });
});

module.exports = router;
