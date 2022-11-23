CREATE TABLE users_issues
(
  user_id uuid REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  issue_id uuid REFERENCES issues (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT users_issues_pkey PRIMARY KEY (user_id, issue_id)
);