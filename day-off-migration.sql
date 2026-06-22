-- Drop old table if it exists, recreate with trainer column
DROP TABLE IF EXISTS planning_day_offs;

CREATE TABLE planning_day_offs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date       DATE        NOT NULL,
  trainer    TEXT        NOT NULL CHECK (trainer IN ('ali', 'samih')),
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_day_trainer UNIQUE (date, trainer)
);

CREATE INDEX IF NOT EXISTS idx_day_offs_date ON planning_day_offs (date);

-- Disable RLS (no auth needed)
ALTER TABLE planning_day_offs DISABLE ROW LEVEL SECURITY;
