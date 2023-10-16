ALTER TABLE users
ADD COLUMN onboarded BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN interests_selected BOOLEAN NOT NULL DEFAULT FALSE,
DROP COLUMN location_submitted_at,
DROP COLUMN initial_issues_selected_at;