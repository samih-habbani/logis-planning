-- Migration: planning_events — Logiscool UAE trainer scheduling
CREATE TABLE IF NOT EXISTS planning_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE        NOT NULL,
  trainer      TEXT        NOT NULL CHECK (trainer IN ('ali', 'samih')),
  center       TEXT        NOT NULL CHECK (center IN ('city_mall', 'oasis', 'mirdif')),
  start_time   TIME        NOT NULL,
  end_time     TIME        NOT NULL,
  curriculum   TEXT,
  student_name TEXT,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_planning_date    ON planning_events (date);
CREATE INDEX IF NOT EXISTS idx_planning_trainer ON planning_events (trainer);
