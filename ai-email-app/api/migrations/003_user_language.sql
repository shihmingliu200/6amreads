-- Add preferred language for email and UI localization

ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

COMMENT ON COLUMN users.language IS 'ISO 639-1 code or zh-Hans/zh-Hant for email content and UI';
