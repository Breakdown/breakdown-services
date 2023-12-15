CREATE TABLE users_seen_bills
(
    user_id     uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    bill_id     uuid REFERENCES bills(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_at  TIMESTAMPTZ  NOT NULL  DEFAULT now(),
    CONSTRAINT users_seen_bills_pkey PRIMARY KEY (user_id, bill_id)

);