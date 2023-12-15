CREATE TABLE cosponsors
(
  rep_id uuid REFERENCES representatives(id) ON UPDATE CASCADE ON DELETE CASCADE,
  bill_id uuid REFERENCES bills(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT cosponsors_pkey PRIMARY KEY (rep_id, bill_id)
);