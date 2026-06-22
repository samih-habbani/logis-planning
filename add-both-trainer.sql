-- Allow 'both' as a valid trainer value
ALTER TABLE planning_events DROP CONSTRAINT IF EXISTS planning_events_trainer_check;
ALTER TABLE planning_events ADD CONSTRAINT planning_events_trainer_check
  CHECK (trainer IN ('ali', 'samih', 'both'));
