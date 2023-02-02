ALTER TABLE bill_full_texts
DROP COLUMN initial_summary,
DROP COLUMN created_at,
DROP COLUMN updated_at;

ALTER TABLE users
DROP COLUMN interests_selected,
DROP COLUMN lat_lon,
DROP COLUMN state_code,
DROP COLUMN district_code;

DROP TABLE users_saved_bills;