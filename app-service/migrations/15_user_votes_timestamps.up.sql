ALTER TABLE users_votes
ADD COLUMN created_at  TIMESTAMPTZ  NOT NULL  DEFAULT now(),
ADD COLUMN updated_at  TIMESTAMPTZ;
