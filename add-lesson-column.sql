-- Add lesson column to planning_events
ALTER TABLE planning_events ADD COLUMN IF NOT EXISTS lesson TEXT;
