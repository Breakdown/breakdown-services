ALTER TABLE issues
ADD COLUMN image_url TEXT;

ALTER TABLE representatives
ADD COLUMN image_url TEXT;

ALTER TABLE users
ADD COLUMN role TEXT NOT NULL DEFAULT 'user';