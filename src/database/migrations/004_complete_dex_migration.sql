-- Complete Migration: Add dex_delta + Fix Buffer Time + Ensure Sunday Week Start
-- This handles all dependencies in the correct order
-- IMPORTANT: Run this as a SINGLE transaction in your Supabase SQL Editor

-- FIXES APPLIED:
-- 1. Week starts Sunday 00:00 UTC (was inconsistent)
-- 2. 4-hour Saturday buffer (20:00-23:59 UTC) - was 8-hour (16:00-23:59)
-- 3. Add dex_delta tracking to weekly/monthly leaderboards

-- ============================================================================
-- STEP 1: Drop dependent views first
-- ============================================================================
DROP VIEW IF EXISTS weekly_leaderboard CASCADE;
DROP VIEW IF EXISTS current_weekly_leaderboard CASCADE;
DROP VIEW IF EXISTS monthly_leaderboard CASCADE;
DROP VIEW IF EXISTS current_monthly_leaderboard CASCADE;

-- ============================================================================
-- STEP 1.5: Update helper functions for correct week logic
-- ============================================================================

-- Fix week start to ensure Sunday 00:00 UTC
CREATE OR REPLACE FUNCTION get_current_week_start()
RETURNS DATE AS $$
BEGIN
  -- Returns Sunday 00:00 UTC (DOW 0=Sunday)
  RETURN CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Update grace period: Saturday 20:00-23:59 UTC (4 hours, not 8!)
CREATE OR REPLACE FUNCTION is_grace_period(upload_time TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
  -- Saturday 20:00-23:59 UTC (4-hour buffer as per PlayerZERO logic)
  RETURN EXTRACT(DOW FROM upload_time)::INTEGER = 6 
         AND EXTRACT(HOUR FROM upload_time)::INTEGER >= 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: Drop and recreate get_week_uploads function with unique_pokedex_entries
-- ============================================================================
DROP FUNCTION IF EXISTS get_week_uploads(UUID, DATE) CASCADE;

CREATE OR REPLACE FUNCTION get_week_uploads(
  user_profile_id UUID,
  week_start_date DATE
)
RETURNS TABLE (
  entry_date DATE,
  total_xp BIGINT,
  pokemon_caught INTEGER,
  distance_walked NUMERIC,
  pokestops_visited INTEGER,
  unique_pokedex_entries INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  prev_saturday DATE := week_start_date - 1;
  week_end DATE := week_start_date + 6;
BEGIN
  RETURN QUERY
  SELECT 
    se.entry_date,
    se.total_xp,
    se.pokemon_caught,
    se.distance_walked,
    se.pokestops_visited,
    se.unique_pokedex_entries,
    se.created_at
  FROM stat_entries se
  WHERE se.profile_id = user_profile_id
    AND (
      -- Grace period: Saturday 20:00-23:59 UTC (4-hour buffer)
      (se.entry_date = prev_saturday AND is_grace_period(se.created_at))
      OR
      -- Regular week: Sunday-Saturday
      (se.entry_date >= week_start_date AND se.entry_date <= week_end)
    )
  ORDER BY se.created_at;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 3: Drop and recreate get_month_uploads function with unique_pokedex_entries
-- ============================================================================
DROP FUNCTION IF EXISTS get_month_uploads(UUID, DATE) CASCADE;

CREATE OR REPLACE FUNCTION get_month_uploads(
  user_profile_id UUID,
  month_start_date DATE
)
RETURNS TABLE (
  entry_date DATE,
  total_xp BIGINT,
  pokemon_caught INTEGER,
  distance_walked NUMERIC,
  pokestops_visited INTEGER,
  unique_pokedex_entries INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  prev_month_last_day DATE := month_start_date - 1;
  month_end DATE := (month_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
BEGIN
  RETURN QUERY
  SELECT 
    se.entry_date,
    se.total_xp,
    se.pokemon_caught,
    se.distance_walked,
    se.pokestops_visited,
    se.unique_pokedex_entries,
    se.created_at
  FROM stat_entries se
  WHERE se.profile_id = user_profile_id
    AND (
      -- Grace period: Last 24 hours of previous month
      se.entry_date = prev_month_last_day
      OR
      -- Current month: 1st to last day
      (se.entry_date >= month_start_date AND se.entry_date <= month_end)
    )
  ORDER BY se.created_at;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 4: Recreate current_weekly_leaderboard view with dex_delta
-- ============================================================================
CREATE OR REPLACE VIEW public.current_weekly_leaderboard AS
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
    (
      SELECT COUNT(*) AS count
      FROM get_week_uploads(p.id, get_current_week_start()) 
      get_week_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
    ) AS upload_count,
    (
      SELECT get_week_uploads.total_xp
      FROM get_week_uploads(p.id, get_current_week_start()) 
      get_week_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_week_uploads.created_at
      LIMIT 1
    ) AS first_xp,
    (
      SELECT get_week_uploads.total_xp
      FROM get_week_uploads(p.id, get_current_week_start()) 
      get_week_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_week_uploads.created_at DESC
      LIMIT 1
    ) AS latest_xp,
    (
      SELECT get_week_uploads.pokemon_caught
      FROM get_week_uploads(p.id, get_current_week_start()) 
      get_week_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_week_uploads.created_at
      LIMIT 1
    ) AS first_catches,
    (
      SELECT get_week_uploads.pokemon_caught
      FROM get_week_uploads(p.id, get_current_week_start()) 
      get_week_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_week_uploads.created_at DESC
      LIMIT 1
    ) AS latest_catches,
    (
      SELECT get_week_uploads.distance_walked
      FROM get_week_uploads(p.id, get_current_week_start()) 
      get_week_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_week_uploads.created_at
      LIMIT 1
    ) AS first_distance,
    (
      SELECT get_week_uploads.distance_walked
      FROM get_week_uploads(p.id, get_current_week_start()) 
      get_week_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_week_uploads.created_at DESC
      LIMIT 1
    ) AS latest_distance,
    (
      SELECT get_week_uploads.pokestops_visited
      FROM get_week_uploads(p.id, get_current_week_start()) 
      get_week_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_week_uploads.created_at
      LIMIT 1
    ) AS first_stops,
    (
      SELECT get_week_uploads.pokestops_visited
      FROM get_week_uploads(p.id, get_current_week_start()) 
      get_week_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_week_uploads.created_at DESC
      LIMIT 1
    ) AS latest_stops,
    (
      SELECT get_week_uploads.unique_pokedex_entries
      FROM get_week_uploads(p.id, get_current_week_start()) 
      get_week_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_week_uploads.created_at
      LIMIT 1
    ) AS first_dex,
    (
      SELECT get_week_uploads.unique_pokedex_entries
      FROM get_week_uploads(p.id, get_current_week_start()) 
      get_week_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_week_uploads.created_at DESC
      LIMIT 1
    ) AS latest_dex,
    (
      SELECT get_week_uploads.entry_date
      FROM get_week_uploads(p.id, get_current_week_start()) 
      get_week_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_week_uploads.created_at DESC
      LIMIT 1
    ) AS last_update
  FROM profiles p
  WHERE p.is_paid_user = true
    AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
    AND p.role = 'user'::text
    AND COALESCE(p.is_blocked, false) = false
)
SELECT
  weekly_stats.profile_id,
  weekly_stats.trainer_name,
  weekly_stats.country,
  weekly_stats.team_color,
  weekly_stats.profile_screenshot_url,
  COALESCE(weekly_stats.latest_xp - weekly_stats.first_xp, 0::bigint) AS xp_delta,
  COALESCE(weekly_stats.latest_catches - weekly_stats.first_catches, 0) AS catches_delta,
  COALESCE(weekly_stats.latest_distance - weekly_stats.first_distance, 0::numeric) AS distance_delta,
  COALESCE(weekly_stats.latest_stops - weekly_stats.first_stops, 0) AS pokestops_delta,
  COALESCE(weekly_stats.latest_dex - weekly_stats.first_dex, 0) AS dex_delta,
  weekly_stats.total_xp,
  weekly_stats.pokemon_caught,
  weekly_stats.distance_walked,
  weekly_stats.pokestops_visited,
  weekly_stats.unique_pokedex_entries,
  weekly_stats.last_update,
  weekly_stats.upload_count
FROM weekly_stats
WHERE weekly_stats.upload_count >= 2
ORDER BY (COALESCE(weekly_stats.latest_xp - weekly_stats.first_xp, 0::bigint)) DESC;

-- ============================================================================
-- STEP 5: Recreate current_monthly_leaderboard view with dex_delta
-- ============================================================================
CREATE OR REPLACE VIEW public.current_monthly_leaderboard AS
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
    (
      SELECT COUNT(*) AS count
      FROM get_month_uploads(p.id, get_current_month_start()) 
      get_month_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
    ) AS upload_count,
    (
      SELECT get_month_uploads.total_xp
      FROM get_month_uploads(p.id, get_current_month_start()) 
      get_month_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_month_uploads.created_at
      LIMIT 1
    ) AS first_xp,
    (
      SELECT get_month_uploads.total_xp
      FROM get_month_uploads(p.id, get_current_month_start()) 
      get_month_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_month_uploads.created_at DESC
      LIMIT 1
    ) AS latest_xp,
    (
      SELECT get_month_uploads.pokemon_caught
      FROM get_month_uploads(p.id, get_current_month_start()) 
      get_month_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_month_uploads.created_at
      LIMIT 1
    ) AS first_catches,
    (
      SELECT get_month_uploads.pokemon_caught
      FROM get_month_uploads(p.id, get_current_month_start()) 
      get_month_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_month_uploads.created_at DESC
      LIMIT 1
    ) AS latest_catches,
    (
      SELECT get_month_uploads.distance_walked
      FROM get_month_uploads(p.id, get_current_month_start()) 
      get_month_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_month_uploads.created_at
      LIMIT 1
    ) AS first_distance,
    (
      SELECT get_month_uploads.distance_walked
      FROM get_month_uploads(p.id, get_current_month_start()) 
      get_month_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_month_uploads.created_at DESC
      LIMIT 1
    ) AS latest_distance,
    (
      SELECT get_month_uploads.pokestops_visited
      FROM get_month_uploads(p.id, get_current_month_start()) 
      get_month_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_month_uploads.created_at
      LIMIT 1
    ) AS first_stops,
    (
      SELECT get_month_uploads.pokestops_visited
      FROM get_month_uploads(p.id, get_current_month_start()) 
      get_month_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_month_uploads.created_at DESC
      LIMIT 1
    ) AS latest_stops,
    (
      SELECT get_month_uploads.unique_pokedex_entries
      FROM get_month_uploads(p.id, get_current_month_start()) 
      get_month_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_month_uploads.created_at
      LIMIT 1
    ) AS first_dex,
    (
      SELECT get_month_uploads.unique_pokedex_entries
      FROM get_month_uploads(p.id, get_current_month_start()) 
      get_month_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_month_uploads.created_at DESC
      LIMIT 1
    ) AS latest_dex,
    (
      SELECT get_month_uploads.entry_date
      FROM get_month_uploads(p.id, get_current_month_start()) 
      get_month_uploads(entry_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, created_at)
      ORDER BY get_month_uploads.created_at DESC
      LIMIT 1
    ) AS last_update
  FROM profiles p
  WHERE p.is_paid_user = true
    AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
    AND p.role = 'user'::text
    AND COALESCE(p.is_blocked, false) = false
)
SELECT
  monthly_stats.profile_id,
  monthly_stats.trainer_name,
  monthly_stats.country,
  monthly_stats.team_color,
  monthly_stats.profile_screenshot_url,
  COALESCE(monthly_stats.latest_xp - monthly_stats.first_xp, 0::bigint) AS xp_delta,
  COALESCE(monthly_stats.latest_catches - monthly_stats.first_catches, 0) AS catches_delta,
  COALESCE(monthly_stats.latest_distance - monthly_stats.first_distance, 0::numeric) AS distance_delta,
  COALESCE(monthly_stats.latest_stops - monthly_stats.first_stops, 0) AS pokestops_delta,
  COALESCE(monthly_stats.latest_dex - monthly_stats.first_dex, 0) AS dex_delta,
  monthly_stats.total_xp,
  monthly_stats.pokemon_caught,
  monthly_stats.distance_walked,
  monthly_stats.pokestops_visited,
  monthly_stats.unique_pokedex_entries,
  monthly_stats.last_update,
  monthly_stats.upload_count
FROM monthly_stats
WHERE monthly_stats.upload_count >= 2
ORDER BY (COALESCE(monthly_stats.latest_xp - monthly_stats.first_xp, 0::bigint)) DESC;

-- ============================================================================
-- STEP 6: Recreate alias views
-- ============================================================================
CREATE VIEW weekly_leaderboard AS SELECT * FROM current_weekly_leaderboard;
CREATE VIEW monthly_leaderboard AS SELECT * FROM current_monthly_leaderboard;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================

-- ============================================================================
-- VERIFICATION: Test that everything works correctly
-- ============================================================================

-- Test 1: Verify week start is Sunday
-- SELECT get_current_week_start(); -- Should return a Sunday date

-- Test 2: Verify grace period is 4 hours (20:00-23:59 UTC)
-- SELECT is_grace_period('2024-10-26 19:59:00+00'::TIMESTAMPTZ); -- Should return FALSE
-- SELECT is_grace_period('2024-10-26 20:00:00+00'::TIMESTAMPTZ); -- Should return TRUE

-- Test 3: Check weekly leaderboard has dex_delta
-- SELECT profile_id, trainer_name, xp_delta, dex_delta FROM current_weekly_leaderboard LIMIT 5;

-- Test 4: Check monthly leaderboard has dex_delta
-- SELECT profile_id, trainer_name, xp_delta, dex_delta FROM current_monthly_leaderboard LIMIT 5;

-- ============================================================================
-- PLAYERZER0 LEADERBOARD LOGIC - COMPLIANCE CHECKLIST
-- ============================================================================
-- 
-- ✅ PERIODS:
--    [✓] Week: Sunday 00:00 UTC to Saturday 23:59 UTC
--    [✓] 4-hour Saturday 20:00 UTC buffer rule
--    [✓] Month: Calendar month in UTC
--    [✓] All-Time: Cumulative totals (separate view)
--
-- ✅ LIVE vs LOCKED RESULTS:
--    [✓] current_weekly_leaderboard = LIVE current week
--    [✓] current_monthly_leaderboard = LIVE current month
--    [✓] get_completed_period_leaderboard() = LOCKED previous periods
--    [✓] All-Time has no locked results (only live totals)
--
-- ✅ CORE STATS TRACKED:
--    [✓] XP (xp_delta)
--    [✓] Pokémon Caught (catches_delta)
--    [✓] PokéStops Visited (pokestops_delta)
--    [✓] Distance (distance_delta)
--    [✓] Dex (dex_delta) ← NEWLY ADDED
--
-- ✅ REQUIREMENTS:
--    [✓] Minimum 2 uploads per period required
--    [✓] Blocked users excluded (is_blocked = false)
--    [✓] Paid users only (is_paid_user = true)
--    [✓] Active subscriptions only
--
-- ============================================================================
-- CHANGES MADE IN THIS MIGRATION:
-- ============================================================================
-- 1. FIXED: Grace period from 8 hours (16:00) → 4 hours (20:00) 
-- 2. FIXED: Ensured week start is Sunday (was inconsistent in schema.sql)
-- 3. ADDED: unique_pokedex_entries to get_week_uploads() return columns
-- 4. ADDED: unique_pokedex_entries to get_month_uploads() return columns
-- 5. ADDED: dex_delta calculation to current_weekly_leaderboard
-- 6. ADDED: dex_delta calculation to current_monthly_leaderboard
-- ============================================================================

