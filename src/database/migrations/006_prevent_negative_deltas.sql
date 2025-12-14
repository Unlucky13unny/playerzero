-- Migration: Prevent Negative Delta Values in Weekly and Monthly Leaderboards
-- Description: Wrap all delta calculations with GREATEST() to ensure negative values display as 0
-- Author: System
-- Date: 2024-12-01

-- ============================================
-- Update current_weekly_leaderboard view
-- ============================================

CREATE OR REPLACE VIEW current_weekly_leaderboard AS
SELECT 
  p.id as profile_id,
  p.trainer_name,
  p.country,
  p.team_color,
  p.profile_screenshot_url,
  -- Prevent negative deltas: GREATEST ensures minimum value is 0
  GREATEST(COALESCE(current_stats.total_xp - week_start_stats.total_xp, 0), 0) as xp_delta,
  GREATEST(COALESCE(current_stats.pokemon_caught - week_start_stats.pokemon_caught, 0), 0) as catches_delta,
  GREATEST(COALESCE(current_stats.distance_walked - week_start_stats.distance_walked, 0), 0) as distance_delta,
  GREATEST(COALESCE(current_stats.pokestops_visited - week_start_stats.pokestops_visited, 0), 0) as pokestops_delta,
  GREATEST(COALESCE(current_stats.unique_pokedex_entries - week_start_stats.unique_pokedex_entries, 0), 0) as dex_delta,
  p.total_xp,
  p.pokemon_caught,
  p.distance_walked,
  p.pokestops_visited,
  p.unique_pokedex_entries,
  COALESCE(current_stats.entry_date, p.updated_at::date) as last_update
FROM profiles p
LEFT JOIN stat_entries current_stats ON p.id = current_stats.profile_id 
  AND current_stats.entry_date = (
    SELECT MAX(entry_date) 
    FROM stat_entries se 
    WHERE se.profile_id = p.id 
    AND se.entry_date >= get_current_week_start()
  )
LEFT JOIN stat_entries week_start_stats ON p.id = week_start_stats.profile_id 
  AND week_start_stats.entry_date = get_current_week_start()
WHERE p.is_paid_user = true
  AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
  AND p.role = 'user'
ORDER BY xp_delta DESC NULLS LAST;

-- ============================================
-- Update current_monthly_leaderboard view
-- ============================================

CREATE OR REPLACE VIEW current_monthly_leaderboard AS
SELECT 
  p.id as profile_id,
  p.trainer_name,
  p.country,
  p.team_color,
  p.profile_screenshot_url,
  -- Prevent negative deltas: GREATEST ensures minimum value is 0
  GREATEST(COALESCE(current_stats.total_xp - month_start_stats.total_xp, 0), 0) as xp_delta,
  GREATEST(COALESCE(current_stats.pokemon_caught - month_start_stats.pokemon_caught, 0), 0) as catches_delta,
  GREATEST(COALESCE(current_stats.distance_walked - month_start_stats.distance_walked, 0), 0) as distance_delta,
  GREATEST(COALESCE(current_stats.pokestops_visited - month_start_stats.pokestops_visited, 0), 0) as pokestops_delta,
  GREATEST(COALESCE(current_stats.unique_pokedex_entries - month_start_stats.unique_pokedex_entries, 0), 0) as dex_delta,
  p.total_xp,
  p.pokemon_caught,
  p.distance_walked,
  p.pokestops_visited,
  p.unique_pokedex_entries,
  COALESCE(current_stats.entry_date, p.updated_at::date) as last_update
FROM profiles p
LEFT JOIN stat_entries current_stats ON p.id = current_stats.profile_id 
  AND current_stats.entry_date = (
    SELECT MAX(entry_date) 
    FROM stat_entries se 
    WHERE se.profile_id = p.id 
    AND se.entry_date >= get_current_month_start()
  )
LEFT JOIN stat_entries month_start_stats ON p.id = month_start_stats.profile_id 
  AND month_start_stats.entry_date = get_current_month_start()
WHERE p.is_paid_user = true
  AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
  AND p.role = 'user'
ORDER BY xp_delta DESC NULLS LAST;

-- ============================================
-- Verification Query
-- ============================================

-- Check that no negative values exist
-- SELECT 
--   trainer_name,
--   xp_delta,
--   catches_delta,
--   distance_delta,
--   pokestops_delta,
--   dex_delta
-- FROM current_weekly_leaderboard
-- WHERE xp_delta < 0 OR catches_delta < 0 OR distance_delta < 0 OR pokestops_delta < 0 OR dex_delta < 0;
-- 
-- Expected: 0 rows (no negative deltas should exist)

