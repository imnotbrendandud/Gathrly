-- In-app notifications, shown on the app's Notifications screen.
--
-- Two kinds today:
--   rsvp_response  a guest answered an invitation to an event the recipient hosts
--   invite         someone invited the recipient to an event
-- Rows are written by whatever performs the action; nothing creates them yet
-- (there are no RSVP or invite endpoints), so for now they come from the dev seed.

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Who sees it.
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('rsvp_response', 'invite')),
  -- Who did it. Kept (as NULL) if that account is later deleted.
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  -- Only for rsvp_response.
  response TEXT CHECK (response IN ('yes', 'maybe', 'no')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- NULL until the recipient has opened the Notifications screen.
  read_at TIMESTAMPTZ,
  CHECK ((type = 'rsvp_response') = (response IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications (user_id) WHERE read_at IS NULL;
