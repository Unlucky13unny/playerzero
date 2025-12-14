-- Migration: Update leaderboard views to respect free mode and filter zero data users
-- This migration modifies all leaderboard views to:
-- 1. Check the is_free_mode feature flag
-- 2. Show all users in free mode, only paid users otherwise
-- 3. Filter out users with zero data for weekly/monthly leaderboards

-- Updated ALL TIME leaderboard view
-- Shows all users (regardless of payment) when free mode is enabled
-- Only shows paid users when free mode is disabled
DROP VIEW IF EXISTS all_time_leaderboard CASCADE;
CREATE OR REPLACE VIEW all_time_leaderboard AS
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
WHERE p.role = 'user'
  AND COALESCE(p.is_blocked, false) = false
  AND (
    -- If free mode is enabled, show all users
    (SELECT value FROM feature_flags WHERE key = 'is_free_mode' LIMIT 1) = true
    OR
    -- Otherwise, only show paid users with active subscriptions
    (
      p.is_paid_user = true
      AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
    )
  )
ORDER BY p.total_xp DESC;

-- Updated WEEKLY leaderboard view
-- Only shows users who have uploaded data during the current week (minimum 2 uploads)
-- Respects free mode flag
DROP VIEW IF EXISTS current_weekly_leaderboard CASCADE;
CREATE OR REPLACE VIEW current_weekly_leaderboard AS
WITH weekly_stats AS (
  SELECT
    p.id AS profile_id,
    p.trainer_name,
    p.country,
    p.team_color,
    p.profile_screenshot_url,
    p.total_xp,
    p.pokemon_caught,
    p.distance_walked,
    p.pokestops_visited,
    p.unique_pokedex_entries,
    -- Count uploads this week
    (
      SELECT COUNT(*)
      FROM get_week_uploads(p.id, get_current_week_start())
    ) AS upload_count,
    -- First upload stats (earliest in week)
    (SELECT total_xp FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at LIMIT 1) AS first_xp,
    (SELECT pokemon_caught FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at LIMIT 1) AS first_catches,
    (SELECT distance_walked FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at LIMIT 1) AS first_distance,
    (SELECT pokestops_visited FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at LIMIT 1) AS first_stops,
    (SELECT unique_pokedex_entries FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at LIMIT 1) AS first_dex,
    -- Latest upload stats (most recent in week)
    (SELECT total_xp FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) AS latest_xp,
    (SELECT pokemon_caught FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) AS latest_catches,
    (SELECT distance_walked FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) AS latest_distance,
    (SELECT pokestops_visited FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) AS latest_stops,
    (SELECT unique_pokedex_entries FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) AS latest_dex,
    (SELECT entry_date FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) AS last_update
  FROM profiles p
  WHERE p.role = 'user'
    AND COALESCE(p.is_blocked, false) = false
    -- Check payment status or free mode
    AND (
      (SELECT value FROM feature_flags WHERE key = 'is_free_mode' LIMIT 1) = true
      OR
      (
        p.is_paid_user = true
        AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
      )
    )
)
SELECT
  weekly_stats.profile_id,
  weekly_stats.trainer_name,
  weekly_stats.country,
  weekly_stats.team_color,
  weekly_stats.profile_screenshot_url,
  GREATEST(COALESCE(weekly_stats.latest_xp - weekly_stats.first_xp, 0), 0) AS xp_delta,
  GREATEST(COALESCE(weekly_stats.latest_catches - weekly_stats.first_catches, 0), 0) AS catches_delta,
  GREATEST(COALESCE(weekly_stats.latest_distance - weekly_stats.first_distance, 0), 0) AS distance_delta,
  GREATEST(COALESCE(weekly_stats.latest_stops - weekly_stats.first_stops, 0), 0) AS pokestops_delta,
  GREATEST(COALESCE(weekly_stats.latest_dex - weekly_stats.first_dex, 0), 0) AS dex_delta,
  weekly_stats.total_xp,
  weekly_stats.pokemon_caught,
  weekly_stats.distance_walked,
  weekly_stats.pokestops_visited,
  weekly_stats.unique_pokedex_entries,
  weekly_stats.last_update,
  weekly_stats.upload_count
FROM weekly_stats
WHERE weekly_stats.upload_count >= 2
ORDER BY xp_delta DESC NULLS LAST;

-- Updated MONTHLY leaderboard view
-- Only shows users who have uploaded data during the current month (minimum 2 uploads)
-- Respects free mode flag
DROP VIEW IF EXISTS current_monthly_leaderboard CASCADE;
CREATE OR REPLACE VIEW current_monthly_leaderboard AS
WITH monthly_stats AS (
  SELECT
    p.id AS profile_id,
    p.trainer_name,
    p.country,
    p.team_color,
    p.profile_screenshot_url,
    p.total_xp,
    p.pokemon_caught,
    p.distance_walked,
    p.pokestops_visited,
    p.unique_pokedex_entries,
    -- Count uploads this month
    (
      SELECT COUNT(*)
      FROM get_month_uploads(p.id, get_current_month_start())
    ) AS upload_count,
    -- First upload stats (earliest in month)
    (SELECT total_xp FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at LIMIT 1) AS first_xp,
    (SELECT pokemon_caught FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at LIMIT 1) AS first_catches,
    (SELECT distance_walked FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at LIMIT 1) AS first_distance,
    (SELECT pokestops_visited FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at LIMIT 1) AS first_stops,
    (SELECT unique_pokedex_entries FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at LIMIT 1) AS first_dex,
    -- Latest upload stats (most recent in month)
    (SELECT total_xp FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) AS latest_xp,
    (SELECT pokemon_caught FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) AS latest_catches,
    (SELECT distance_walked FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) AS latest_distance,
    (SELECT pokestops_visited FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) AS latest_stops,
    (SELECT unique_pokedex_entries FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) AS latest_dex,
    (SELECT entry_date FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) AS last_update
  FROM profiles p
  WHERE p.role = 'user'
    AND COALESCE(p.is_blocked, false) = false
    -- Check payment status or free mode
    AND (
      (SELECT value FROM feature_flags WHERE key = 'is_free_mode' LIMIT 1) = true
      OR
      (
        p.is_paid_user = true
        AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
      )
    )
)
SELECT
  monthly_stats.profile_id,
  monthly_stats.trainer_name,
  monthly_stats.country,
  monthly_stats.team_color,
  monthly_stats.profile_screenshot_url,
  GREATEST(COALESCE(monthly_stats.latest_xp - monthly_stats.first_xp, 0), 0) AS xp_delta,
  GREATEST(COALESCE(monthly_stats.latest_catches - monthly_stats.first_catches, 0), 0) AS catches_delta,
  GREATEST(COALESCE(monthly_stats.latest_distance - monthly_stats.first_distance, 0), 0) AS distance_delta,
  GREATEST(COALESCE(monthly_stats.latest_stops - monthly_stats.first_stops, 0), 0) AS pokestops_delta,
  GREATEST(COALESCE(monthly_stats.latest_dex - monthly_stats.first_dex, 0), 0) AS dex_delta,
  monthly_stats.total_xp,
  monthly_stats.pokemon_caught,
  monthly_stats.distance_walked,
  monthly_stats.pokestops_visited,
  monthly_stats.unique_pokedex_entries,
  monthly_stats.last_update,
  monthly_stats.upload_count
FROM monthly_stats
WHERE monthly_stats.upload_count >= 2
ORDER BY xp_delta DESC NULLS LAST;

-- Recreate the alias views
DROP VIEW IF EXISTS weekly_leaderboard CASCADE;
CREATE VIEW weekly_leaderboard AS SELECT * FROM current_weekly_leaderboard;

DROP VIEW IF EXISTS monthly_leaderboard CASCADE;
CREATE VIEW monthly_leaderboard AS SELECT * FROM current_monthly_leaderboard;

-- Add comment to document the changes
COMMENT ON VIEW all_time_leaderboard IS 'Shows all users with any data. Respects is_free_mode flag - shows all users when enabled, only paid users when disabled.';
COMMENT ON VIEW current_weekly_leaderboard IS 'Shows users who uploaded data during current week. Filtered by payment status unless is_free_mode is enabled.';
COMMENT ON VIEW current_monthly_leaderboard IS 'Shows users who uploaded data during current month. Filtered by payment status unless is_free_mode is enabled.';

