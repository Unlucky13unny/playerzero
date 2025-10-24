-- ============================================================================
-- UPDATE ALL PREVIOUS WINNERS VIEWS
-- ============================================================================
-- This script updates both previous_week_winners and previous_month_winners
-- to include proper period columns and enforce all requirements
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. UPDATE previous_week_winners VIEW
-- ============================================================================

DROP VIEW IF EXISTS public.previous_week_winners CASCADE;

CREATE VIEW public.previous_week_winners AS
WITH date_bounds AS (
  SELECT
    -- Last week start: Previous Sunday 00:00 UTC
    (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 7)::DATE AS week_start,
    -- Last week end: Previous Saturday 23:59 UTC
    (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 1)::DATE AS week_end
),
weekly_uploads AS (
  SELECT 
    p.id AS profile_id,
    p.trainer_name,
    p.team_color,
    p.country,
    p.profile_screenshot_url,
    d.week_start AS period_start,
    d.week_end AS period_end,
    COUNT(*) AS upload_count,
    MIN(se.total_xp) AS first_xp,
    MAX(se.total_xp) AS latest_xp,
    MIN(se.pokemon_caught) AS first_catches,
    MAX(se.pokemon_caught) AS latest_catches,
    MIN(se.distance_walked) AS first_distance,
    MAX(se.distance_walked) AS latest_distance,
    MIN(se.pokestops_visited) AS first_stops,
    MAX(se.pokestops_visited) AS latest_stops,
    MIN(se.unique_pokedex_entries) AS first_dex,
    MAX(se.unique_pokedex_entries) AS latest_dex,
    MAX(se.created_at) AS last_update
  FROM profiles p
  CROSS JOIN date_bounds d
  INNER JOIN stat_entries se ON p.id = se.profile_id
  WHERE p.is_paid_user = true
    AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
    AND p.role = 'user'
    AND COALESCE(p.is_blocked, false) = false
    AND (
      -- Grace period: Saturday 20:00-23:59 UTC (4-hour buffer before week starts)
      (se.entry_date = d.week_start - 1 AND EXTRACT(HOUR FROM se.created_at) >= 20)
      OR
      -- Regular week: Sunday through Saturday
      (se.entry_date >= d.week_start AND se.entry_date <= d.week_end)
    )
  GROUP BY p.id, p.trainer_name, p.team_color, p.country, p.profile_screenshot_url, d.week_start, d.week_end
  HAVING COUNT(*) >= 2
)
SELECT 
  profile_id,
  trainer_name,
  team_color,
  country,
  profile_screenshot_url,
  period_start,
  period_end,
  GREATEST(COALESCE(latest_xp - first_xp, 0), 0) AS xp_delta,
  GREATEST(COALESCE(latest_catches - first_catches, 0), 0) AS catches_delta,
  GREATEST(COALESCE(latest_distance - first_distance, 0), 0) AS distance_delta,
  GREATEST(COALESCE(latest_stops - first_stops, 0), 0) AS pokestops_delta,
  GREATEST(COALESCE(latest_dex - first_dex, 0), 0) AS dex_delta,
  last_update,
  ROW_NUMBER() OVER (ORDER BY GREATEST(COALESCE(latest_xp - first_xp, 0), 0) DESC) AS rank
FROM weekly_uploads
WHERE GREATEST(COALESCE(latest_xp - first_xp, 0), 0) > 0
ORDER BY xp_delta DESC
LIMIT 10;

-- ============================================================================
-- 2. UPDATE previous_month_winners VIEW
-- ============================================================================

DROP VIEW IF EXISTS public.previous_month_winners CASCADE;

CREATE VIEW public.previous_month_winners AS
WITH date_bounds AS (
  SELECT
    -- Last month start: First day of previous month
    (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::DATE AS month_start,
    -- Last month end: Last day of previous month
    (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::DATE AS month_end
),
monthly_uploads AS (
  SELECT 
    p.id AS profile_id,
    p.trainer_name,
    p.team_color,
    p.country,
    p.profile_screenshot_url,
    d.month_start AS period_start,
    d.month_end AS period_end,
    COUNT(*) AS upload_count,
    MIN(se.total_xp) AS first_xp,
    MAX(se.total_xp) AS latest_xp,
    MIN(se.pokemon_caught) AS first_catches,
    MAX(se.pokemon_caught) AS latest_catches,
    MIN(se.distance_walked) AS first_distance,
    MAX(se.distance_walked) AS latest_distance,
    MIN(se.pokestops_visited) AS first_stops,
    MAX(se.pokestops_visited) AS latest_stops,
    MIN(se.unique_pokedex_entries) AS first_dex,
    MAX(se.unique_pokedex_entries) AS latest_dex,
    MAX(se.created_at) AS last_update
  FROM profiles p
  CROSS JOIN date_bounds d
  INNER JOIN stat_entries se ON p.id = se.profile_id
  WHERE p.is_paid_user = true
    AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
    AND p.role = 'user'
    AND COALESCE(p.is_blocked, false) = false
    AND (
      -- Grace period: Last 24 hours of previous month
      se.entry_date = d.month_start - 1
      OR
      -- Current month: 1st to last day
      (se.entry_date >= d.month_start AND se.entry_date <= d.month_end)
    )
  GROUP BY p.id, p.trainer_name, p.team_color, p.country, p.profile_screenshot_url, d.month_start, d.month_end
  HAVING COUNT(*) >= 2
)
SELECT 
  profile_id,
  trainer_name,
  team_color,
  country,
  profile_screenshot_url,
  period_start,
  period_end,
  GREATEST(COALESCE(latest_xp - first_xp, 0), 0) AS xp_delta,
  GREATEST(COALESCE(latest_catches - first_catches, 0), 0) AS catches_delta,
  GREATEST(COALESCE(latest_distance - first_distance, 0), 0) AS distance_delta,
  GREATEST(COALESCE(latest_stops - first_stops, 0), 0) AS pokestops_delta,
  GREATEST(COALESCE(latest_dex - first_dex, 0), 0) AS dex_delta,
  last_update,
  ROW_NUMBER() OVER (ORDER BY GREATEST(COALESCE(latest_xp - first_xp, 0), 0) DESC) AS rank
FROM monthly_uploads
WHERE GREATEST(COALESCE(latest_xp - first_xp, 0), 0) > 0
ORDER BY xp_delta DESC
LIMIT 10;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test previous_week_winners
SELECT 
  rank,
  trainer_name,
  period_start,
  period_end,
  xp_delta,
  catches_delta,
  distance_delta,
  pokestops_delta,
  dex_delta,
  last_update
FROM public.previous_week_winners
ORDER BY rank;

-- Test previous_month_winners
SELECT 
  rank,
  trainer_name,
  period_start,
  period_end,
  xp_delta,
  catches_delta,
  distance_delta,
  pokestops_delta,
  dex_delta,
  last_update
FROM public.previous_month_winners
ORDER BY rank;

-- Check what periods are being queried
SELECT 
  'Weekly' as period_type,
  (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 7)::DATE AS period_start,
  (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 1)::DATE AS period_end
UNION ALL
SELECT 
  'Monthly' as period_type,
  (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::DATE AS period_start,
  (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::DATE AS period_end;

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- Both views now include:
-- ✅ period_start - Start date of the period
-- ✅ period_end - End date of the period
-- ✅ dex_delta - Pokédex entries gained
-- ✅ 2-upload minimum requirement (HAVING COUNT(*) >= 2)
-- ✅ Grace period logic (Saturday 20:00-23:59 for weekly, last day for monthly)
-- ✅ Non-negative deltas (GREATEST function)
-- ✅ Top 10 winners (LIMIT 10)
-- ✅ Proper week calculation (Sunday to Saturday)
-- ✅ Proper month calculation (Calendar month in UTC)
-- ✅ Only users with positive XP gains shown
-- ============================================================================

