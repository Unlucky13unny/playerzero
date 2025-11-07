-- ============================================================================
-- UPDATE all_time_leaderboard VIEW
-- ============================================================================
-- This updates the view to:
-- 1. Add profile_id column (needed for user identification)
-- 2. Add unique_pokedex_entries column (needed for Dex sorting)
-- 3. Add is_blocked filter (exclude blocked users)
-- ============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.all_time_leaderboard CASCADE;

-- Recreate with all necessary fields
CREATE VIEW public.all_time_leaderboard AS
SELECT 
  p.id as profile_id,
  p.trainer_name,
  p.country,
  p.team_color,
  p.profile_screenshot_url,
  p.total_xp,
  p.pokemon_caught,
  p.distance_walked,
  p.pokestops_visited,
  p.unique_pokedex_entries,
  p.updated_at as last_update
FROM profiles p
WHERE p.is_paid_user = true
  AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
  AND p.role = 'user'
  AND COALESCE(p.is_blocked, false) = false
ORDER BY p.total_xp DESC;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Test the updated view
SELECT 
  profile_id,
  trainer_name,
  country,
  team_color,
  total_xp,
  pokemon_caught,
  distance_walked,
  pokestops_visited,
  unique_pokedex_entries,
  last_update
FROM public.all_time_leaderboard
ORDER BY total_xp DESC
LIMIT 10;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- Key Changes:
-- 1. ✅ Added profile_id (p.id as profile_id)
-- 2. ✅ Added unique_pokedex_entries for Dex sorting
-- 3. ✅ Added is_blocked filter to exclude blocked users
-- 4. ✅ Maintains all other existing fields
-- 5. ✅ Sorted by total_xp DESC by default
--
-- This view now supports:
-- - Sorting by XP, Catches, Distance, Pokestops, AND Dex
-- - User identification via profile_id
-- - Proper filtering of blocked users
-- ============================================================================

