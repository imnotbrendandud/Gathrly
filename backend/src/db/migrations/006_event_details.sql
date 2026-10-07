-- Everything the Create Event form asks for beyond a title, date and place.
--
-- `location` stays the short name shown on event cards ("Natalie's Apartment",
-- or the street when the host gave no name); `address` is the full line
-- underneath it ("123 Street St Unit 411, Detroit, MI, United States").

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS address TEXT,
  -- private: guests need an invite or the link. public: anyone on Gathrly can RSVP.
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private',
  -- Guests claim items, or add their own, on a shared "what to bring" list.
  ADD COLUMN IF NOT EXISTS contributions_enabled BOOLEAN NOT NULL DEFAULT false,
  -- How many extra people each guest may bring.
  ADD COLUMN IF NOT EXISTS plus_ones INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS require_plus_one_names BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE events
  ADD CONSTRAINT events_visibility_check CHECK (visibility IN ('private', 'public')),
  ADD CONSTRAINT events_plus_ones_check CHECK (plus_ones BETWEEN 0 AND 10),
  ADD CONSTRAINT events_ends_after_start_check CHECK (ends_at IS NULL OR ends_at > starts_at);
