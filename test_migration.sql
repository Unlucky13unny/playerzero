-- Test script for upload limits migration
-- Run this after applying the migration to verify it works

-- 1. Check if the unique constraint was removed
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'stat_entries' 
  AND constraint_name = 'stat_entries_user_id_entry_date_key';
-- Expected: No rows (constraint should be removed)

-- 2. Test inserting multiple entries for same user/date
-- (Replace 'test-user-id' with an actual user ID from your database)

-- First entry
INSERT INTO stat_entries (
  user_id, 
  profile_id, 
  entry_date, 
  total_xp, 
  pokemon_caught, 
  distance_walked, 
  pokestops_visited, 
  unique_pokedex_entries, 
  trainer_level
) VALUES (
  'test-user-id',
  'test-profile-id', 
  CURRENT_DATE,
  1000000,
  5000,
  100.5,
  2000,
  400,
  40
);

-- Second entry (should succeed now that constraint is removed)
INSERT INTO stat_entries (
  user_id, 
  profile_id, 
  entry_date, 
  total_xp, 
  pokemon_caught, 
  distance_walked, 
  pokestops_visited, 
  unique_pokedex_entries, 
  trainer_level
) VALUES (
  'test-user-id',
  'test-profile-id', 
  CURRENT_DATE,
  1001000,
  5010,
  101.0,
  2005,
  401,
  40
);

-- 3. Verify both entries exist
SELECT COUNT(*) as entry_count
FROM stat_entries 
WHERE user_id = 'test-user-id' 
  AND entry_date = CURRENT_DATE;
-- Expected: 2 (or more if additional entries exist)

-- 4. Clean up test data
DELETE FROM stat_entries 
WHERE user_id = 'test-user-id' 
  AND entry_date = CURRENT_DATE;

-- 5. Verify the new index was created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'stat_entries' 
  AND indexname = 'idx_stat_entries_user_date';
-- Expected: 1 row showing the index definition
