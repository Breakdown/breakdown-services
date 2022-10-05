create table bills
(
  id uuid  PRIMARY KEY  DEFAULT uuid_generate_v1mc(),
  propublica_id  TEXT UNIQUE  NOT NULL,
  -- number in ProPublica
  bill_code  TEXT,
  bill_uri  TEXT,
  title  TEXT,
  short_title  TEXT,
  sponsor_propublica_id  TEXT,
  sponsor_state  TEXT,
  sponsor_party  TEXT,
  gpo_pdf_uri  TEXT,
  congressdotgov_url  TEXT,
  govtrack_url  TEXT,
  introduced_date  TEXT,
  last_vote  TEXT,
  status  TEXT,
  introduced_on  TEXT,
  house_passage  TEXT,
  senate_passage  TEXT,
  enacted  TEXT,
  vetoed  TEXT,
  primary_subject  TEXT,
  summary  TEXT,
  summary_short  TEXT,
  latest_major_action_date  TEXT,
  latest_major_action  TEXT,
  last_updated  TEXT,
  legislative_day  TEXT,
  active  BOOLEAN,
  committees  TEXT[],
  committee_codes  TEXT[],
  subcommittee_codes  TEXT[],
  cosponsors_d  INTEGER,
  cosponsors_r  INTEGER,
  subjects  TEXT[],
  -- Breakdown Fields
  edited  BOOLEAN,
  human_summary  TEXT,
  human_short_summary  TEXT,
  human_title  TEXT,
  human_short_title  TEXT,
  importance INTEGER,
  created_at  TIMESTAMPTZ  NOT NULL  DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

SELECT trigger_updated_at('bills');

--      table.string("sponsor_id").nullable(); - single sponsor, many cosponsors