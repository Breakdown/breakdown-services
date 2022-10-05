drop table "bills_issues";
ALTER TABLE bills
  DROP COLUMN primary_issue_id;
drop table "issues";