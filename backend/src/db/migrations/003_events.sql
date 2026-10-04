-- Events and RSVPs, the data behind the app's Home screen.
--
-- An event belongs to one host. Everyone else is a row in event_rsvps: a guest
-- starts as 'invited' and moves to 'going' or 'declined'. Drafts are events the
-- host has not published yet, so they may not have a date or location.

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT,
  starts_at TIMESTAMPTZ,
  -- NULL means no cap on guests.
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  -- Guests who have not answered by this time are shown "Confirm by <date>".
  rsvp_deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Only drafts may be missing a date.
  CHECK (status = 'draft' OR starts_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS events_host_id_idx ON events (host_id, starts_at);
CREATE INDEX IF NOT EXISTS events_starts_at_idx ON events (starts_at) WHERE status = 'published';

CREATE TABLE IF NOT EXISTS event_rsvps (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'going', 'declined')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS event_rsvps_user_id_idx ON event_rsvps (user_id);
