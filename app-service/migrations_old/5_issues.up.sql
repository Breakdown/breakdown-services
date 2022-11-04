create table issues
(
  id uuid  primary key  default uuid_generate_v1mc(),
  name TEXT,
  slug TEXT UNIQUE NOT NULL,
  subjects TEXT[],
  created_at  TIMESTAMPTZ  NOT NULL  default now(),
  updated_at  TIMESTAMPTZ
);
SELECT trigger_updated_at('issues');

-- add primary issue id to bills table
ALTER TABLE bills ADD COLUMN primary_issue_id uuid
  CONSTRAINT fk_primary_issue REFERENCES issues(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- issues_bills join table
CREATE TABLE bills_issues (
  bill_id uuid REFERENCES bills (id) ON UPDATE CASCADE ON DELETE CASCADE,
  issue_id uuid REFERENCES issues (id) ON UPDATE CASCADE,
  CONSTRAINT bills_issues_pkey PRIMARY KEY (bill_id, issue_id)
);