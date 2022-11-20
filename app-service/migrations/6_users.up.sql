CREATE TABLE users
(
  id uuid  PRIMARY KEY  DEFAULT uuid_generate_v1mc(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  -- Demographic Fields
  address TEXT,
  state_id CONSTRAINT fk_state REFERENCES states(id) ON UPDATE CASCADE ON DELETE SET NULL,
  district_id CONSTRAINT fk_district REFERENCES districts(id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  NOT NULL  DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

SELECT trigger_updated_at('users');