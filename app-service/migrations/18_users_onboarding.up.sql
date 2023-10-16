ALTER TABLE users
DROP COLUMN onboarded,
DROP COLUMN interests_selected,
ADD COLUMN location_submitted_at  TIMESTAMPTZ,
ADD COLUMN initial_issues_selected_at  TIMESTAMPTZ;