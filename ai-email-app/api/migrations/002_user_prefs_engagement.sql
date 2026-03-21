-- 6amreads: user delivery prefs, OAuth, engagement tracking

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS delivery_hour SMALLINT DEFAULT 6;
ALTER TABLE users ADD COLUMN IF NOT EXISTS paused BOOLEAN DEFAULT false;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_delivery_hour_check;
ALTER TABLE users ADD CONSTRAINT users_delivery_hour_check
  CHECK (delivery_hour IS NULL OR (delivery_hour >= 0 AND delivery_hour <= 23));

CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_unique
  ON users (google_sub) WHERE google_sub IS NOT NULL;

ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;

COMMENT ON COLUMN users.delivery_hour IS 'Local delivery hour 0-23 (default 6 AM)';
COMMENT ON COLUMN users.paused IS 'When true, skip daily send';
