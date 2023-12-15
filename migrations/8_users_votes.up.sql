CREATE TABLE users_votes
(
  user_id uuid REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  bill_id uuid REFERENCES bills (id) ON UPDATE CASCADE ON DELETE CASCADE,
  vote boolean NOT NULL,
  CONSTRAINT users_bills_pkey PRIMARY KEY (user_id, bill_id)
);