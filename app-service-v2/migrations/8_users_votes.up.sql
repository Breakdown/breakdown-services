CREATE TABLE users_votes
(
  user_id uuid CONSTRAINT users_votes_user_id_fk REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  bill_id uuid CONSTRAINT users_votes_bill_id_fk REFERENCES bills (id) ON UPDATE CASCADE ON DELETE CASCADE,
  vote boolean NOT NULL,
  CONSTRAINT users_votes_pkey PRIMARY KEY (user_id, bill_id)
);