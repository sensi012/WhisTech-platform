-- WhisTech Platform — initial schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS tasks (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'todo'
                           CHECK (status IN ('todo','in_progress','done','cancelled')),
  priority    VARCHAR(20)  NOT NULL DEFAULT 'medium'
                           CHECK (priority IN ('low','medium','high','critical')),
  due_date    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
