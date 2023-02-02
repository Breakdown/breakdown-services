ALTER TABLE bill_full_texts
ADD COLUMN initial_summary TEXT,
ADD COLUMN created_at  TIMESTAMPTZ  NOT NULL  default now(),
ADD COLUMN updated_at  TIMESTAMPTZ;

SELECT trigger_updated_at('bill_full_texts');

ALTER TABLE users
ADD COLUMN interests_selected BOOLEAN NOT NULL default false,
ADD COLUMN lat_lon TEXT[],
ADD COLUMN state_code TEXT,
ADD COLUMN district_code TEXT;

CREATE TABLE users_saved_bills
(
  user_id uuid CONSTRAINT users_saved_bills_user_id_fk REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  bill_id uuid CONSTRAINT users_saved_bills_bill_id_fk REFERENCES bills (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT users_saved_bills_pkey PRIMARY KEY (user_id, bill_id)
);

SELECT trigger_updated_at('users_saved_bills');