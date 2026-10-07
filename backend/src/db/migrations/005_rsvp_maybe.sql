-- Guests can answer an invitation with "maybe" as well as yes or no. A maybe
-- still counts as unanswered for the host's "Confirm by" deadline.
ALTER TABLE event_rsvps DROP CONSTRAINT IF EXISTS event_rsvps_status_check;
ALTER TABLE event_rsvps
  ADD CONSTRAINT event_rsvps_status_check
  CHECK (status IN ('invited', 'going', 'maybe', 'declined'));
