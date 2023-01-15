CREATE TABLE bill_full_texts
(
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bill_id uuid REFERENCES bills (id) ON UPDATE CASCADE ON DELETE SET NULL,
  text text NOT NULL
);