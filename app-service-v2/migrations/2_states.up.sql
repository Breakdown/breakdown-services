create table states
(
  id uuid  primary key  default uuid_generate_v1mc(),
  name TEXT,
  code TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL  default now(),
  updated_at  TIMESTAMPTZ
);
SELECT trigger_updated_at('states');

CREATE TABLE districts
( 
  id uuid  primary key  default uuid_generate_v1mc(),
  state_id uuid  NOT NULL  CONSTRAINT fk_state REFERENCES states(id) ON UPDATE CASCADE ON DELETE CASCADE,
  code TEXT,
  created_at  TIMESTAMPTZ  NOT NULL  default now(),
  updated_at  TIMESTAMPTZ
);
SELECT trigger_updated_at('districts');