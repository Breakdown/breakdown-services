CREATE TABLE representatives_votes
(
  rep_propublica_id TEXT,
  chamber TEXT,
  congress TEXT,
  congressional_session TEXT,
  roll_call TEXT,
  vote_uri TEXT,
  bill_propublica_id TEXT,
  question TEXT,
  result TEXT,
  position BOOLEAN,
  voted_at TIMESTAMPTZ,
  bill_id uuid REFERENCES bills (id) ON UPDATE CASCADE ON DELETE SET NULL,
  representative_id uuid REFERENCES representatives (id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT representatives_votes_pkey PRIMARY KEY (representative_id, bill_id, bill_propublica_id, roll_call)
);