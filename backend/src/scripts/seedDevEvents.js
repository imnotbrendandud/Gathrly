/**
 * Fill a dev account's Home, Past Events, Drafts and Notifications screens with
 * the placeholder data from the Figma designs: three upcoming events, four past
 * ones, two drafts, and the RSVP-response and invite notifications.
 *
 *   npm run seed:events -- you@example.com
 *
 * The account must already exist (sign in once first). Safe to re-run: it
 * replaces whatever an earlier run created. Refuses to run in production.
 */
const pool = require('../db/pool');
const env = require('../config/env');

const GUEST_COUNT = 18;
const guestEmail = (n) => `seed-guest-${String(n).padStart(2, '0')}@example.invalid`;

// The people named in the Figma designs. The first two host Music Night (at
// Brendan's Apartment) and the birthday party (at Natalie's House).
const GUEST_NAMES = [
  'Brendan Czekaj',
  'Natalie Hoang',
  'Allen Shi',
  'Brandon',
  'Nikole',
  'Elise Lapointe',
  'Jadden Kirchoff',
  'Gretchen Fancher',
];

/** `daysFromNow` days out, at `hour` o'clock local time. */
function at(daysFromNow, hour) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** A moment `ms` milliseconds in the past. */
const ago = (ms) => new Date(Date.now() - ms);

async function main() {
  if (env.nodeEnv === 'production') {
    console.error('Refusing to seed events in production.');
    process.exit(1);
  }

  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    console.error('usage: npm run seed:events -- you@example.com');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const me = (await client.query('SELECT id FROM users WHERE email = $1', [email])).rows[0];
    if (!me) {
      throw new Error(`No account for ${email}. Sign in to the app with it once, then re-run.`);
    }

    // Guests stand in for the people RSVPing; two of them also host.
    const guestIds = [];
    for (let n = 1; n <= GUEST_COUNT; n += 1) {
      const { rows } = await client.query(
        `INSERT INTO users (email, name, email_verified)
         VALUES ($1, $2, true)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [guestEmail(n), GUEST_NAMES[n - 1] ?? `Guest ${n}`]
      );
      guestIds.push(rows[0].id);
    }

    // Clear the previous run (events cascade to their RSVPs and notifications).
    await client.query('DELETE FROM notifications WHERE user_id = $1', [me.id]);
    // The placeholder guests are shared by every seeded account, so only remove
    // their events that this account was invited to.
    await client.query(
      `DELETE FROM events
        WHERE (host_id = ANY($1::uuid[])
               AND id IN (SELECT event_id FROM event_rsvps WHERE user_id = $2))
           OR (host_id = $2 AND title = ANY($3::text[]))`,
      // Includes titles earlier versions of this script created, so re-running
      // cleans those up too.
      [guestIds, me.id, ['Field Day 2027', 'Summer BBQ', 'Game Night', 'Untitled Event', 'Palentine’s Day 2027']]
    );

    async function createEvent(fields) {
      const { rows } = await client.query(
        `INSERT INTO events (host_id, title, location, starts_at, capacity, rsvp_deadline, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          fields.hostId,
          fields.title,
          fields.location ?? null,
          fields.startsAt ?? null,
          fields.capacity ?? null,
          fields.rsvpDeadline ?? null,
          fields.status ?? 'published',
        ]
      );
      return rows[0].id;
    }

    async function rsvp(eventId, userId, status) {
      await client.query(
        `INSERT INTO event_rsvps (event_id, user_id, status, responded_at)
         VALUES ($1, $2, $3, CASE WHEN $3 = 'invited' THEN NULL ELSE now() END)`,
        [eventId, userId, status]
      );
    }

    // Hosting: 18 of 24 going.
    const fieldDay = await createEvent({
      hostId: me.id,
      title: 'Field Day 2027',
      location: 'Montibeller Park',
      startsAt: at(4, 18),
      capacity: 24,
    });
    for (const guestId of guestIds) await rsvp(fieldDay, guestId, 'going');

    // Attending, already confirmed.
    const musicNight = await createEvent({
      hostId: guestIds[0],
      title: 'Music Night',
      location: "Brendan's Apartment",
      startsAt: at(9, 16),
    });
    await rsvp(musicNight, me.id, 'going');

    // Attending, answered maybe and still needs a final answer.
    const partyStart = at(35, 17);
    const birthday = await createEvent({
      hostId: guestIds[1],
      title: 'Medieval Birthday Party',
      location: "Natalie's House",
      startsAt: partyStart,
      rsvpDeadline: new Date(partyStart.getTime() - 4 * DAY),
    });
    await rsvp(birthday, me.id, 'maybe');

    // Past Events: three attended as a guest (from the design) and one hosted.
    // guestIds[7], [3] and [1] are Gretchen, Brandon and Natalie.
    const pastAttended = [
      { hostId: guestIds[7], title: 'Minecraft Party', startsAt: at(-5, 18) },
      { hostId: guestIds[3], title: 'Game Night', location: "Brandon's Place", startsAt: at(-57, 16) },
      { hostId: guestIds[1], title: 'A2 Bar Crawl', location: 'Ann Arbor', startsAt: at(-114, 20) },
    ];
    for (const fields of pastAttended) await rsvp(await createEvent(fields), me.id, 'going');

    const bbq = await createEvent({
      hostId: me.id,
      title: 'Summer BBQ',
      location: 'Backyard',
      startsAt: at(-14, 13),
      capacity: 12,
    });
    for (const guestId of guestIds.slice(0, 6)) await rsvp(bbq, guestId, 'going');

    // Drafts: one with only a date, one with only a place.
    await createEvent({ hostId: me.id, title: 'Untitled Event', startsAt: at(5, 12), status: 'draft' });
    await createEvent({ hostId: me.id, title: 'Palentine’s Day 2027', location: 'Natalie’s House', status: 'draft' });

    // Notifications, all unread so the Home bell shows its dot.
    async function notify({ type, actorId, eventId, response = null, createdAt }) {
      await client.query(
        `INSERT INTO notifications (user_id, type, actor_id, event_id, response, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [me.id, type, actorId, eventId, response, createdAt]
      );
    }

    // Events tab: people answering the invitation to Field Day.
    // guestIds[2..6] are Allen, Brandon, Nikole, Elise and Jadden.
    await notify({ type: 'rsvp_response', actorId: guestIds[2], eventId: fieldDay, response: 'maybe', createdAt: ago(30 * MINUTE) });
    await notify({ type: 'rsvp_response', actorId: guestIds[3], eventId: fieldDay, response: 'yes', createdAt: ago(1 * HOUR) });
    await notify({ type: 'rsvp_response', actorId: guestIds[4], eventId: fieldDay, response: 'no', createdAt: ago(2 * HOUR) });
    await notify({ type: 'rsvp_response', actorId: guestIds[5], eventId: fieldDay, response: 'yes', createdAt: ago(1 * DAY + 2 * HOUR) });
    await notify({ type: 'rsvp_response', actorId: guestIds[0], eventId: fieldDay, response: 'yes', createdAt: ago(38 * DAY) });
    await notify({ type: 'rsvp_response', actorId: guestIds[6], eventId: fieldDay, response: 'yes', createdAt: ago(45 * DAY) });

    // Invites tab: the two events the account was invited to.
    await notify({ type: 'invite', actorId: guestIds[1], eventId: birthday, createdAt: ago(3 * HOUR) });
    await notify({ type: 'invite', actorId: guestIds[0], eventId: musicNight, createdAt: ago(2 * DAY) });

    await client.query('COMMIT');
    console.log(`Seeded 3 upcoming, 4 past and 2 draft events and 8 notifications for ${email}.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
