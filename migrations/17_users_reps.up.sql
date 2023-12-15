CREATE TABLE users_following_representatives
(
    user_id     uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    representative_id     uuid REFERENCES representatives(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_at  TIMESTAMPTZ  NOT NULL  DEFAULT now(),
    CONSTRAINT users_following_representatives_pkey PRIMARY KEY (user_id, representative_id)
);