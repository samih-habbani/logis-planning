-- Create dynamic trainers table
CREATE TABLE IF NOT EXISTS planning_trainers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,  -- lowercase slug, e.g. 'ali'
  color      TEXT        NOT NULL DEFAULT 'sky',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE planning_trainers DISABLE ROW LEVEL SECURITY;

-- Seed existing trainers
INSERT INTO planning_trainers (name, color) VALUES ('ali', 'sky'), ('samih', 'violet')
ON CONFLICT (name) DO NOTHING;

-- Remove hardcoded CHECK constraints so any trainer name is valid
ALTER TABLE planning_events DROP CONSTRAINT IF EXISTS planning_events_trainer_check;
ALTER TABLE planning_day_offs DROP CONSTRAINT IF EXISTS planning_day_offs_trainer_check;
